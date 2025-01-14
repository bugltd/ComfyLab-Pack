import type {
	LGraphNode,
	INodeOutputSlot,
	IWidget,
	INodeInputSlot,
	LLink,
} from '@comfyorg/litegraph'

import { app } from '~/.mock/scripts/app.js'

import { isObject, log } from '~/shared/common.js'
import { guessOutputType, compatibleTypes } from '../types.js'
import {
	fetchApi,
	slotShapes,
	removeAllOutputs,
	lookupNodes,
} from '../utils.js'
import {
	ApiValidationError,
	IConfigValidationResult,
} from '../config.common.js'

interface IOutputEntry {
	value: unknown
	type?: string | string[]
	label?: string
	tooltip?: string
	shape?: keyof typeof slotShapes
	color_on?: string
	color_off?: string
	node?: string | number
}
type ExtraInfo = 'label' | 'tooltip' | 'shape' | 'color_on' | 'color_off'
type IConnectionInfo = [IWidget | INodeInputSlot][]
interface IParsedEntry {
	value: unknown
	type: string | string[]
	extra_info: Pick<IOutputEntry, ExtraInfo>
	connect: IConnectionInfo
}

type NotObject = Exclude<
	unknown,
	Record<string, unknown> | { [key in string]: unknown }
>
// raw data before parse
type IOutputData = Record<string, IOutputEntry | NotObject>
// parsed data
export type IOutputParsed = Record<string, unknown>
export type IOutputErrors = Record<string, string[]>

export const OUTPUT_CONNECT_CHOICES = {
	auto: 'yes, and convert widgets to inputs',
	no_convert: 'yes, but do not convert widgets to inputs',
	preserve: 'no, but preserve existing links if possible',
	drop: 'no, and drop existing links',
} as const

export const OUTPUT_MULTINODES_CHOICES = {
	no: 'do not auto-connect (default)',
	remove: 'do not auto-connect and remove output',
	all: 'connect to all',
}

export async function processOutputConfigAuto(
	node: LGraphNode,
	config: string | undefined,
	strategy: keyof typeof OUTPUT_CONNECT_CHOICES,
): Promise<IConfigValidationResult<IOutputParsed, IOutputErrors>> {
	let body = {} as { data?: IOutputData; errors?: ApiValidationError[] }
	let data: IOutputData = {}

	log.inspect({ strategy })
	log.debug(app.graph._nodes)

	if (config) {
		try {
			// load data from response
			body = await fetchApi('config_validate', 'POST', {
				raw: config,
				schema: 'config.output.auto',
			})
		} catch (error) {
			removeAllOutputs(node)
			return {
				success: false,
				error: (error as Error).message,
			}
		}

		data = body.data as IOutputData
	}

	const apiErrors: ApiValidationError[] = body.errors || []
	type IError = Partial<Record<keyof IOutputEntry, string>>
	const errors: Record<string, IError> = {}
	// build errors
	for (const [errorScope, errorType] of apiErrors) {
		if (!Object.keys(errors).includes(errorScope[0])) errors[errorScope[0]] = {}
		errors[errorScope[0]][errorScope[1] as keyof IOutputEntry] = errorType
	}

	// no data => early exit
	if (Object.keys(data).length === 0) {
		removeAllOutputs(node)
		return {
			success: false,
			error: 'No data',
		}
	}

	// parse the errors to have explicit labels
	const errorLabels: Record<string, string[]> = {}
	let nbErrors = 0
	for (const [output, props] of Object.entries(errors)) {
		errorLabels[output] = []
		for (const [prop, errorType] of Object.entries(props)) {
			nbErrors++
			if (errorType === 'required') {
				errorLabels[output].push(`'${prop}' is required`)
				continue
			}
			let label = `'${prop}' `
			switch (prop) {
				case 'type':
					label += 'should be a string, or a list of strings'
					break
				case 'label':
				case 'tooltip':
				case 'color_off':
				case 'color_on':
					label += 'should be a string'
					break
				case 'shape':
					label += "should be one of: 'box', 'circle', 'arrow', 'grid'"
					break
			}
			errorLabels[output].push(label)
		}
	}

	// parse data, filtering the entries in error
	const parsed: Map<string, IParsedEntry> = new Map()
	for (const [k, entry] of Object.entries(data)) {
		if (Object.keys(errorLabels).includes(k)) continue
		const key = String(k)
		let value, type
		const extra_info: Record<string, unknown> = {} // for label, tooltip, ...
		const connect: IConnectionInfo = []
		if (!isObject(entry)) {
			value = entry
			type = guessOutputType(value)
		} else {
			const entryObj = entry as IOutputEntry
			value = entryObj['value']
			// try to determine type
			if (Object.keys(entryObj).includes('type')) {
				type = entryObj['type']
			} else {
				type = guessOutputType(value)
			}
			// get optional info: label, tooltip, color
			// TODO: tooltip doesn't work, keep it? Or try to find a way, maybe w/ element.title
			for (const extra of ['label', 'tooltip', 'color_on', 'color_off']) {
				if (Object.keys(entryObj).includes(extra))
					extra_info[extra] = entryObj[extra as keyof IOutputEntry]
			}
			// special case for slot shape
			if (entryObj.shape && Object.keys(slotShapes).includes(entryObj.shape))
				extra_info.shape = slotShapes[entryObj.shape]

			// manage connections
			if (Object.keys(entryObj).includes('node')) {
				const found = lookupNodes(entryObj.node as string | number)
				if (found.length === 1) connect.push(found[0])
			}
		}
		parsed.set(key, {
			value,
			type: type as string | string[],
			extra_info,
			connect,
		})
	}

	// remove all outputs, but keep a track of existing links if applicable, to recreate them
	const existingLinks: Record<string, LLink[]> = {}
	while (node.outputs?.length > 0) {
		const output: INodeOutputSlot = node.outputs[0]
		const entry = parsed.get(output.name)
		// only keep a track if name, label and type are identical, and if there are links
		if (
			strategy !== 'drop' &&
			entry &&
			compatibleTypes(entry.type, output.type) &&
			entry.extra_info.label === output.label &&
			output.links &&
			output.links.length
		) {
			const links: LLink[] = []
			for (const l of output.links) {
				const link = node.graph.links.get(l)
				if (link) links.push(link)
			}
			if (links.length) existingLinks[output.name] = links
		}
		node.removeOutput(0)
	}

	// add the outputs from parsed, and recreate previous connections; this ensure we preserve the comfig order
	for (const [name, entry] of parsed.entries()) {
		node.addOutput(name, entry.type, entry.extra_info)
		// recreate links
		const links = existingLinks[name]
		if (links) {
			for (const link of links) {
				const targetNode = node.graph._nodes_by_id[link.target_id]
				node.connect(name, targetNode, link.target_slot)
			}
		}
	}

	if (nbErrors === 0)
		return {
			success: true,
			data: Object.fromEntries(parsed),
			applied: true,
		}
	else
		return {
			success: 'partial',
			data: Object.fromEntries(parsed),
			nbErrors,
			errors: errorLabels,
			applied: true,
		}
}
