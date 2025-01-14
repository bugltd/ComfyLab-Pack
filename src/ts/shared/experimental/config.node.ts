import type { LGraphNode, IWidget } from '@comfyorg/litegraph'

import { findWidget, fetchApi } from '~/shared/utils.js'
import {
	ApiValidationError,
	WidgetValue,
	IConfigValidationResult,
} from '~/shared/config.common.js'

class ConvertError extends Error {}

export const NODECONFIG_CHECK_LEVELS = {
	any: 'any error: unknown widget, value not matching widget type',
	config_only: 'invalid config only (ex. value as list)',
	none: 'none: apply as much as possible',
} as const

// data after parse
export type INodeConfigParsed = Record<string, WidgetValue>
export type INodeConfigErrors = Record<string, string>

function convertToWidgetValue(value: unknown, widget: IWidget): WidgetValue {
	type AllTypes = 'string' | 'int' | 'float' | 'bool'
	const baseValueType = typeof value
	if (!['string', 'number', 'boolean'].includes(baseValueType))
		throw new ConvertError('should be a string, number or boolean')
	// determine the value compatible types
	const strValue = String(value)
	const valueTypes: AllTypes[] = []
	if (baseValueType === 'boolean') {
		valueTypes.push('bool')
	} else if (baseValueType === 'number') {
		valueTypes.push('float')
		if (Number.isInteger(value)) valueTypes.push('int')
	} else {
		valueTypes.push('string')
		// check if we can convert to boolean or number
		if (strValue === 'true' || strValue === 'false') {
			valueTypes.push('bool')
		} else if (!isNaN(+strValue)) {
			valueTypes.push('float')
			if (Number.isInteger(+strValue)) valueTypes.push('int')
		}
	}
	// determine the widget compatible types
	// for all but number, we may successfully return
	const isInt = widget.type === 'number' && widget.options?.round === 1
	switch (widget.type) {
		case 'text':
		case 'customtext':
			if (!valueTypes.includes('string'))
				throw new ConvertError('expected a string')
			return strValue
		case 'toggle':
			if (!valueTypes.includes('bool'))
				throw new ConvertError('expected a boolean')
			if (baseValueType === 'boolean') return value as boolean
			else if (strValue === 'true') return true
			else return false
		case 'combo':
			if (
				!valueTypes.includes('string') ||
				!widget.options.values.includes(value)
			)
				throw new ConvertError(
					'expected one of: ' +
						widget.options.values.map((v: string) => `'${v}'`).join(', '),
				)
			return strValue
		case 'number':
			if (isInt) {
				if (!valueTypes.includes('int'))
					throw new ConvertError('expected an integer')
			} else {
				if (!valueTypes.includes('float'))
					throw new ConvertError('expected a float')
			}
			break
		default:
			throw new ConvertError(`unknown widget type '${widget.type}'`)
	}

	// for numbers, check if we respect min / max / precision
	const nbValue = value as number
	const widgetMin = widget.options.min
	const widgetMax = widget.options.max

	if ((widgetMin || widgetMin === 0) && nbValue < widgetMin)
		throw new ConvertError(`minimum value is ${widgetMin}`)
	if ((widgetMax || widgetMax === 0) && nbValue > widgetMax)
		throw new ConvertError(`maximum value is ${widgetMax}`)
	// TODO: handle round with floats?

	// return number value
	return +strValue
}

export async function fetchNodeConfig(
	otherNode: LGraphNode,
	format: 'json' | 'yaml',
): Promise<string> {
	if (!otherNode) return ''
	const data = otherNode.widgets.reduce(
		(acc: Record<string, unknown>, w: IWidget) => {
			acc[w.name] = w.value
			return acc
		},
		{},
	)

	let body = undefined

	try {
		body = await fetchApi('config_convert', 'POST', {
			data,
			format,
		})
	} catch (error) {
		return 'Internal error: ' + (error as Error).message
	}
	return body.prettified
}

export interface ICheckReturn {
	parsed: Map<string, WidgetValue>
	errorLabels: Record<string, string>
	earlyExit: boolean
}
/**
 * Perform all the checks, before applying config to a node
 * @param targetNode node
 * @param apiData raw data, provided by API
 * @param rawErrors raw errors, transformed from API to a dict
 * @param checkLevel 'any', 'config_only', 'none'
 * @returns parsed data and errors if applicable
 */
export function checkNodeConfig(
	targetNode: LGraphNode,
	apiData: INodeConfigParsed,
	rawErrors: INodeConfigErrors,
	checkLevel: 'any' | 'config_only' | 'none',
): ICheckReturn {
	// iterate data and filter widgets in error
	const parsed: Map<string, WidgetValue> = new Map()
	for (const [k, val] of Object.entries(apiData)) {
		if (Object.keys(rawErrors).includes(k)) continue
		parsed.set(k, val)
	}

	// first collect the validation errors
	const errorLabels: Record<string, string> = {}
	for (const key of Object.keys(rawErrors)) {
		errorLabels[key] = 'should be a string, number or boolean'
	}
	// rdepending on the check level, we may return right away
	if (
		Object.keys(errorLabels).length > 0 &&
		['config_only', 'any'].includes(checkLevel)
	) {
		return {
			parsed,
			errorLabels,
			earlyExit: true,
		}
	}

	// simulate applying the widget values, converting values if necessary
	// copy the Map keys, as we may delete entries
	const widgetNames = Array.from(parsed.keys())
	for (const name of widgetNames) {
		const widget = findWidget(targetNode, name)
		if (!widget) {
			errorLabels[name] = 'not found in node'
			parsed.delete(name)
			continue
		}
		// try to convert the value to match the widget type if necessary, and replace it in Map
		try {
			const converted = convertToWidgetValue(parsed.get(name), widget)
			parsed.set(name, converted)
		} catch (e) {
			const err = e as ConvertError
			errorLabels[name] = err.message
			parsed.delete(name)
		}
	}

	return {
		parsed,
		errorLabels,
		earlyExit: false,
	}
}

export async function applyNodeConfig(
	targetNode: LGraphNode,
	config: string,
	checkLevel: keyof typeof NODECONFIG_CHECK_LEVELS,
): Promise<IConfigValidationResult<INodeConfigParsed, INodeConfigErrors>> {
	if (!targetNode || !config) return
	let body = undefined

	try {
		// load data from response
		body = await fetchApi('config_validate', 'POST', {
			raw: config,
			schema: 'config.node',
		})
	} catch (error) {
		return {
			success: false,
			error: (error as Error).message,
		}
	}

	const apiData = body.data as INodeConfigParsed
	const apiErrors: ApiValidationError[] = body.errors || []
	const rawErrors: INodeConfigErrors = {}
	// build errors
	for (const [errorScope, errorType] of apiErrors) {
		rawErrors[errorScope[0]] = errorType
	}

	// perform the preliminary checks
	const checked = checkNodeConfig(targetNode, apiData, rawErrors, checkLevel)
	if (checked.earlyExit) {
		return {
			success: 'partial',
			data: {},
			nbErrors: Object.keys(checked.errorLabels).length,
			errors: checked.errorLabels,
			applied: false,
		}
	}

	// before applying, return if strict level is any or if there are no widget left
	if (
		checked.parsed.size === 0 ||
		(Object.keys(checked.errorLabels).length > 0 && checkLevel === 'any')
	) {
		return {
			success: 'partial',
			data: {},
			nbErrors: Object.keys(checked.errorLabels).length,
			errors: checked.errorLabels,
			applied: false,
		}
	}

	// apply to widgets, catch errors to help debugging
	const widgetNames = Array.from(checked.parsed.keys())
	for (const name of widgetNames) {
		const widget = findWidget(targetNode, name)
		if (!widget) continue // should not happen, already checked above
		try {
			widget.value = checked.parsed.get(name)
			if (widget.callback) await widget.callback(widget.value)
		} catch (e) {
			checked.errorLabels[name] = 'Unknown error: ' + String(e)
			checked.parsed.delete(name)
		}
	}

	// return now if nothing was applied
	if (checked.parsed.size === 0)
		return {
			success: 'partial',
			data: {},
			nbErrors: Object.keys(checked.errorLabels).length,
			errors: checked.errorLabels,
			applied: false,
		}

	// applied partially
	if (Object.keys(checked.errorLabels).length > 0)
		return {
			success: 'partial',
			data: Object.fromEntries(checked.parsed),
			nbErrors: Object.keys(checked.errorLabels).length,
			errors: checked.errorLabels,
			applied: true,
		}

	// fully applied
	return {
		success: true,
		data: Object.fromEntries(checked.parsed),
		applied: true,
	}
}
