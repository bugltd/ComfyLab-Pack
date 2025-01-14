import type { LGraphNode, IWidget } from '@comfyorg/litegraph'

import { app } from '~/.mock/scripts/app.js'

import { fetchApi, findWidget } from '~/shared/utils.js'
import {
	ApiValidationError,
	WidgetValue,
	IConfigValidationResult,
} from '~/shared/config.common.js'
import { checkNodeConfig } from '~/shared/experimental/config.node.js'
import { log } from '~/shared/common.js'

export const MULTICONFIG_NODE_BY = {
	id: 'ID (recommended)',
	title: 'title',
	name: 'name (for S&R)',
} as const

export const MULTICONFIG_CHECK_LEVELS = {
	any: 'any error: unknown node / widget, value not matching widget type, ...',
	config_only: 'invalid config only (ex. value as list)',
	none: 'none: apply as much as possible',
} as const

// data after parse
export type IMultiConfigParsed = Record<string, Record<string, WidgetValue>>
export type IMultiConfigErrors = Record<string, string[]>

export async function fetchMultiConfig(
	thisNode: LGraphNode,
	nodeBy: keyof typeof MULTICONFIG_NODE_BY,
	format: 'json' | 'yaml',
): Promise<string> {
	const data: Record<string, Record<string, unknown>> = {}
	const duplicates: Set<string> = new Set()
	const getNodeKey = (() => {
		switch (nodeBy) {
			case 'id':
				return (otherNode: LGraphNode) => String(otherNode.id)
			case 'title':
				return (otherNode: LGraphNode) => otherNode.title
			case 'name':
				return (otherNode: LGraphNode) => otherNode.type
		}
	})()

	for (const otherNode of thisNode.graph._nodes) {
		if (otherNode === thisNode) continue
		const key = getNodeKey(otherNode)
		if (Object.keys(data).includes(key)) {
			duplicates.add(key)
			continue
		}
		data[key] = otherNode.widgets.reduce(
			(acc: Record<string, unknown>, w: IWidget) => {
				acc[w.name] = w.value
				return acc
			},
			{},
		)
	}
	for (const dup of duplicates.values()) delete data[dup]

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

function findNodes(key: string, prop: 'title' | 'type'): LGraphNode[] {
	const found: LGraphNode[] = []
	for (const node of app.graph._nodes) {
		if (node[prop] === key) found.push(node)
	}
	return found
}
function lookupNodes(key: string | number): LGraphNode[] {
	const strKey = String(key)
	// check if key is a node ID
	if (!isNaN(+strKey) && Number.isInteger(+strKey)) {
		const node: LGraphNode | undefined = app.graph._nodes_by_id[+strKey]
		return node ? [node] : []
	}
	return [...findNodes(strKey, 'title'), ...findNodes(strKey, 'type')]
}

export async function applyMultiConfig(
	config: string,
	checkLevel: keyof typeof MULTICONFIG_CHECK_LEVELS,
): Promise<IConfigValidationResult<IMultiConfigParsed, IMultiConfigErrors>> {
	if (!config) return
	let body = undefined

	try {
		// load data from response
		body = await fetchApi('config_validate', 'POST', {
			raw: config,
			schema: 'config.multi',
		})
	} catch (error) {
		return {
			success: false,
			error: (error as Error).message,
		}
	}

	const apiData = body.data as IMultiConfigParsed
	const apiErrors: ApiValidationError[] = body.errors || []
	type IError = Record<string, string>
	const rawErrors: Record<string, IError> = {}
	// build errors
	for (const [errorScope, errorType] of apiErrors) {
		if (!Object.keys(rawErrors).includes(errorScope[0]))
			rawErrors[errorScope[0]] = {}
		rawErrors[errorScope[0]][errorScope[1]] = errorType
	}

	log.debug(checkLevel)
	log.inspect({ apiData })
	log.inspect({ rawErrors })
	log.inspect({ app })

	// const parsed: IMultiConfigParsed = {}
	const errorLabels: IMultiConfigErrors = {}
	const allParsed: Record<string, Map<string, WidgetValue>> = {}
	const allNodes: Record<string, LGraphNode> = {}

	// loop through all nodes, and for each, perform the prelimimary checks
	let earlyExit = false
	let nbErrors = 0
	let nbParsed = 0
	for (const nodeKey of Object.keys(apiData)) {
		const found = lookupNodes(nodeKey)
		if (found.length === 0) {
			errorLabels[nodeKey] = ['node not found']
			nbErrors += 1
			continue
		} else if (found.length > 1) {
			errorLabels[nodeKey] = ['multiple nodes found - skipped']
			nbErrors += 1
			continue
		}
		if (!apiData[nodeKey]) continue // empty data => skip
		allNodes[nodeKey] = found[0] // store node, we need it later
		const checked = checkNodeConfig(
			found[0],
			apiData[nodeKey],
			rawErrors[nodeKey] || {},
			checkLevel,
		)
		allParsed[nodeKey] = checked.parsed
		nbParsed += checked.parsed.size
		// collect errors
		for (const [widgetName, errorLabel] of Object.entries(
			checked.errorLabels,
		)) {
			if (!errorLabels[nodeKey]) errorLabels[nodeKey] = []
			errorLabels[nodeKey].push(`'${widgetName}': ${errorLabel}`)
			nbErrors += 1
		}
		if (checked.earlyExit) earlyExit = true
	}

	// before applying, return if strict level is any and there are errors, or in case of an early exit, or if no widget left
	if (nbParsed === 0 || earlyExit || (nbErrors > 0 && checkLevel === 'any')) {
		return {
			success: 'partial',
			data: {},
			nbErrors,
			errors: errorLabels,
			applied: false,
		}
	}

	// apply to widgets, catch errors to help debugging
	for (const [nodeKey, parsed] of Object.entries(allParsed)) {
		const targetNode = allNodes[nodeKey]
		if (!targetNode) continue
		const widgetNames = Array.from(parsed.keys())
		for (const name of widgetNames) {
			const widget = findWidget(targetNode, name)
			if (!widget) continue // should not happen, already checked above
			try {
				widget.value = parsed.get(name)
				if (widget.callback) await widget.callback(widget.value)
			} catch (e) {
				if (!errorLabels[nodeKey]) errorLabels[nodeKey] = []
				errorLabels[nodeKey].push(`'${name}': Unknown error: ${e}`)
				nbErrors += 1
				allParsed[nodeKey].delete(name)
				nbParsed -= 1
			}
		}
	}

	// return now if nothing was applied
	if (nbParsed === 0)
		return {
			success: 'partial',
			data: {},
			nbErrors,
			errors: errorLabels,
			applied: false,
		}

	// build parsed dictionary
	const parsedDict: IMultiConfigParsed = {}
	for (const [nodeKey, parsed] of Object.entries(allParsed)) {
		parsedDict[nodeKey] = Object.fromEntries(parsed)
	}

	// applied partially
	if (nbErrors > 0)
		return {
			success: 'partial',
			data: parsedDict,
			nbErrors: nbErrors,
			errors: errorLabels,
			applied: true,
		}

	// fully applied
	return {
		success: true,
		data: parsedDict,
		applied: true,
	}
}
