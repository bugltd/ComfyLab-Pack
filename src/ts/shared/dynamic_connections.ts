// See: https://github.com/melMass/comfy_mtb/blob/main/web/comfy_shared.js#L399

import { app } from '~/.mock/scripts/app.js'
import type {
	LGraphNode,
	LLink,
	IWidget,
	INodeInputSlot,
	INodeOutputSlot,
	ISlotType,
} from '@comfyorg/litegraph'

type INodesFromLink = {
	to: LGraphNode
	from: LGraphNode
	type: 'error' | 'incoming' | 'outgoing'
}
/**
 * @param {LGraphNode} node
 * @param {LLink} link
 * @returns {{to:LGraphNode, from:LGraphNode, type:'error' | 'incoming' | 'outgoing'}}
 */
export const nodesFromLink = (
	node: LGraphNode,
	link: LLink,
): INodesFromLink => {
	const fromNode = app.graph.getNodeById(link.origin_id)
	const toNode = app.graph.getNodeById(link.target_id)

	let tp: INodesFromLink['type'] = 'error'

	if (fromNode.id === node.id) {
		tp = 'outgoing'
	} else if (toNode.id === node.id) {
		tp = 'incoming'
	}

	return { to: toNode, from: fromNode, type: tp }
}

type IOnConnectionsChangeParams = {
	type: ISlotType
	slotIndex: number
	isConnected: boolean
	link: LLink
	ioSlot: INodeInputSlot | INodeOutputSlot
}
interface ISetupDynamicConnectionsOpts {
	separator?: string
	start_index?: number
	link?: LLink
	ioSlot?: INodeInputSlot | INodeOutputSlot
	DEBUG?: {
		node: LGraphNode
	} & IOnConnectionsChangeParams
}
/**
 * @param {NodeType} nodeType The nodetype to attach the documentation to
 * @param {str} prefix A prefix added to each dynamic inputs
 * @param {str | [str]} inputType The datatype(s) of those dynamic inputs
 * @param {{separator?:string, start_index?:number, link?:LLink, ioSlot?:INodeInputSlot | INodeOutputSlot}?} [opts] Extra options
 * @returns
 */
export const setupDynamicConnections = (
	nodeType: LGraphNode,
	prefix: string,
	inputType: string | string[],
	opts: ISetupDynamicConnectionsOpts | undefined = undefined,
) => {
	// console.log(
	//   "Setting up dynamic connections for",
	//   Object.getOwnPropertyDescriptors(nodeType).title.value
	// );

	/** @type {{separator:string, start_index:number, link?:LLink, ioSlot?:INodeInputSlot | INodeOutputSlot}?} */
	// const options = opts || {};
	const options = Object.assign(
		{
			separator: '_',
			start_index: 1,
		},
		opts || {},
	)
	const onNodeCreated = nodeType.prototype.onNodeCreated
	const inputList = typeof inputType === 'object'

	nodeType.prototype.onNodeCreated = function () {
		const r = onNodeCreated ? onNodeCreated.apply(this, []) : undefined
		this.addInput(
			`${prefix}${options.separator}${options.start_index}`,
			inputList ? '*' : inputType,
		)
		return r
	}

	const onConnectionsChange = nodeType.prototype.onConnectionsChange
	/**
	 * @param {OnConnectionsChangeParams} args
	 */
	nodeType.prototype.onConnectionsChange = function (...args: unknown[]) {
		const [type, slotIndex, isConnected, link, ioSlot] = args

		options.link = link
		options.ioSlot = ioSlot
		const r = onConnectionsChange
			? onConnectionsChange.apply(this, [
					type,
					slotIndex,
					isConnected,
					link,
					ioSlot,
				])
			: undefined
		options.DEBUG = {
			node: this,
			type,
			slotIndex,
			isConnected,
			link,
			ioSlot,
		} as ISetupDynamicConnectionsOpts['DEBUG']

		// keep a track of current size, and also the minimum / computed one
		const oldSize = [this.size[0], this.size[1]]
		const oldComputedSize = this.computeSize()

		dynamicConnection(
			this,
			slotIndex as number,
			isConnected as boolean,
			`${prefix}${options.separator}`,
			inputType as string,
			options,
		)

		// reset positions of all widgets, they will be recalculated
		for (const widget of this.widgets || []) {
			delete widget.y
			delete widget.last_y
			// computedHeight is used by the multiline widgets, it must be reset to force it to take all height
			delete widget.computedHeight
		}
		// get the new computed size, after adding / removing inputs
		const newComputedSize = this.computeSize()
		// recalculate the node size: preserve width, and increase / decrease height
		this.setSize([
			oldSize[0],
			oldSize[1] + newComputedSize[1] - oldComputedSize[1],
		])

		return r
	}
}

interface IDynamicConnectionOpts {
	start_index?: number
	link?: LLink
	ioSlot?: INodeInputSlot | INodeOutputSlot
	nameArray?: string[]
}
/**
 * Main logic around dynamic inputs
 *
 * @param {LGraphNode} node - The target node
 * @param {number} index - The slot index of the currently changed connection
 * @param {bool} connected - Was this event connecting or disconnecting
 * @param {string} [connectionPrefix] - The common prefix of the dynamic inputs
 * @param {string|[string]} [connectionType] - The type of the dynamic connection
 * @param {{start_index?:number, link?:LLink, ioSlot?:INodeInputSlot | INodeOutputSlot}} [opts] - extra options
 */
export const dynamicConnection = (
	node: LGraphNode,
	index: number,
	connected: boolean,
	connectionPrefix: string = 'input_',
	connectionType: string = '*',
	opts: IDynamicConnectionOpts | undefined = undefined,
) => {
	/* @type {{link?:LLink, ioSlot?:INodeInputSlot | INodeOutputSlot}} [opts] - extra options*/
	// const options = opts || {};
	const options = Object.assign(
		{
			start_index: 1,
		},
		opts || {},
	)

	// function to test if input is a dynamic one
	const isDynamicInput = (inputName: string) =>
		inputName.startsWith(connectionPrefix)

	if (node.inputs.length > 0 && !isDynamicInput(node.inputs[index].name)) {
		return
	}

	const listConnection = typeof connectionType === 'object'

	const conType = listConnection ? '*' : connectionType
	const nameArray = options.nameArray || []

	const clean_inputs = () => {
		if (node.inputs.length === 0) return

		// let w_count = node.widgets?.length || 0
		let i_count = node.inputs?.length || 0
		// console.log(
		//   `Cleaning inputs: [BEFORE] (w: ${w_count} | inputs: ${i_count})`
		// );

		const to_remove = []
		for (let n = 1; n < node.inputs.length; n++) {
			const element = node.inputs[n]
			if (!element.link && isDynamicInput(element.name)) {
				if (node.widgets) {
					const w = node.widgets.find((w: IWidget) => w.name === element.name)
					if (w) {
						w.onRemoved?.()
						node.widgets.length = node.widgets.length - 1
					}
				}
				// console.log(`Removing input ${n}`);
				to_remove.push(n)
			}
		}
		for (let i = 0; i < to_remove.length; i++) {
			const id = to_remove[i]

			node.removeInput(id)
			i_count -= 1
		}
		node.inputs.length = i_count

		// w_count = node.widgets?.length || 0
		i_count = node.inputs?.length || 0
		// console.log(
		//   `Cleaning inputs: [AFTER] (w: ${w_count} | inputs: ${i_count})`
		// );

		// console.log("Cleaning inputs: making it sequential again");
		// make inputs sequential again
		let prefixed_idx = options.start_index
		for (let i = 0; i < node.inputs.length; i++) {
			//   let name = `${connectionPrefix}${i + 1}`;
			let name = ''
			// rename only prefixed inputs
			if (isDynamicInput(node.inputs[i].name)) {
				// prefixed => rename and increase index
				name = `${connectionPrefix}${prefixed_idx}`
				prefixed_idx += 1
			} else {
				// not prefixed => keep same name
				name = node.inputs[i].name
			}

			if (nameArray.length > 0) {
				name = i < nameArray.length ? nameArray[i] : name
			}

			// preserve label if it exists
			node.inputs[i].label = node.inputs[i].label || name
			node.inputs[i].name = name
		}
	}
	if (!connected) {
		if (!options.link) {
			// console.log("Disconnecting", { options });

			clean_inputs()
		} else {
			if (!options.ioSlot.link) {
				node.connectionTransit = true
			} else {
				node.connectionTransit = false
				clean_inputs()
			}
			// console.log("Reconnecting", { options });
		}
	}

	if (connected) {
		if (options.link) {
			// const { from, to, type } = nodesFromLink(node, options.link)
			const link = nodesFromLink(node, options.link)
			if (link.type === 'outgoing') return
			// console.log("Connecting", { options, from, to, type });
		} else {
			// console.log("Connecting", { options });
		}

		if (node.connectionTransit) {
			// console.log("In Transit");
			node.connectionTransit = false
		}

		// Remove inputs and their widget if not linked.
		clean_inputs()

		if (node.inputs.length === 0) return
		// add an extra input
		if (node.inputs[node.inputs.length - 1].link !== null) {
			//   const nextIndex = node.inputs.length;

			// count only the prefixed inputs
			const nextIndex = node.inputs.reduce(
				(acc: number, cur: INodeInputSlot) =>
					isDynamicInput(cur.name) ? ++acc : acc,
				0,
			)

			const name =
				nextIndex < nameArray.length
					? nameArray[nextIndex]
					: `${connectionPrefix}${nextIndex + options.start_index}`

			// console.log(`Adding input ${nextIndex + options.start_index} (${name})`);

			node.addInput(name, conType)
		}
	}
}
