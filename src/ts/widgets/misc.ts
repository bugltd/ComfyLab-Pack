import { LGraphNode, IWidget } from '@comfyorg/litegraph'

import { InputSpec } from '~/.d.ts/comfyui-frontend-types_alt.js'
import {
	makeButtonWidget,
	type IComboWidget,
	makeComboWidget,
} from '~/widgets/factories.js'
import { makeWidgetAsync } from '~/shared/utils.js'
import { log } from '~/shared/common.js'

/**
 * Create an hidden widget. To be used in `getCustomWidgets(app)`
 * @param {*} node
 * @param {*} inputName
 * @param {*} inputData
 * @param {*} _app
 * @returns
 */
export function HIDDEN(
	node: LGraphNode,
	inputName: string,
	inputData: InputSpec,
	// // eslint-disable-next-line @typescript-eslint/no-unused-vars
	// _app: ComfyApp | undefined,
) {
	// the value in inputData is only used when creating a new workdlow
	// otherwise, the cached value will be used by Comfy
	// TODO: should be default instead? If so, correct XYPlotQueue
	const initialValue = inputData[1].value
	// there is no callback, as it doesn't get called for non-standard widgets (see LGraphCanvas.prototype.processNodeWidgets)
	// if needed, we could replace value w/ getter / setter
	const widget: IWidget = {
		type: 'HIDDEN',
		name: inputName,
		value: initialValue,
		size: [0, -4],
		computeSize: () => {
			return [0, -4]
		},
	}
	node.addCustomWidget(widget)
	return widget
}

export function BTN(node: LGraphNode, inputName: string, inputData: InputSpec) {
	const label = inputData[1].label || inputName
	return makeButtonWidget(node, inputName, label, inputData[1])
}

export function NODE_COMBO(node: LGraphNode, name: string) {
	type NodeListWidget = IWidget<string> & {
		selected?: number
		selectedNode?: LGraphNode
		onSelected?: (
			selectedId: number | undefined,
			selectedNode: LGraphNode | undefined,
		) => void | Promise<void>
	}
	const getNodeList = (_widget: IWidget, thisNode: LGraphNode | undefined) => {
		const nodes = ['']
		if (thisNode)
			nodes.push(
				...thisNode.graph._nodes
					.filter((otherNode: LGraphNode) => otherNode.id !== thisNode.id)
					.map((otherNode: LGraphNode) => {
						return `#${otherNode.id}: ${otherNode.title}`
					}),
			)
		return nodes
	}
	const getSelected = (label: string) => {
		if (!label) {
			return [undefined, undefined]
		} else {
			const selected = parseInt(label.split(':')[0].substring(1))
			return [selected, node.graph._nodes_by_id[selected]]
		}
	}
	const widget = node.addWidget(
		'combo',
		name,
		'',
		async function (this: NodeListWidget, label: string) {
			;[this.selected, this.selectedNode] = getSelected(label)
			if (this.onSelected)
				await this.onSelected(this.selected, this.selectedNode)
		},
		{ values: getNodeList },
	)

	// use an EventTarget to allow async callback, and replace default one
	makeWidgetAsync(widget)
	widget.callback = async (label: string) => {
		;[widget.selected, widget.selectedNode] = getSelected(label)
		if (widget.onSelected)
			await widget.onSelected(widget.selected, widget.selectedNode)
	}

	widget.tooltip = 'select node from list'

	// enssure we reload the values at node.onConfigure
	const original_onNodeConfigure = node.onConfigure
	node.onConfigure = function (...args: unknown[]) {
		;[widget.selected, widget.selectedNode] = getSelected(widget.value)
		original_onNodeConfigure?.apply(this, ...args)
	}

	return widget
}

export const ERROR_DISPLAY_CHOICES = {
	browser: 'in browser console (F12)',
	dialog: 'in a popup',
	none: 'do not display',
} as const
export type ErrorDisplayChoices = keyof typeof ERROR_DISPLAY_CHOICES

export function ERROR_DISPLAY(
	node: LGraphNode,
	name: string = 'error_display',
) {
	type ErrorDisplayWidget = IComboWidget<typeof ERROR_DISPLAY_CHOICES>

	const widget = makeComboWidget(
		node,
		name,
		ERROR_DISPLAY_CHOICES,
		'dialog',
		() => {},
		'how to display detected errors',
	)
	return widget as ErrorDisplayWidget
}

export function MODEL_LIST(
	node: LGraphNode,
	inputName: string,
	inputData: InputSpec,
) {
	inputData[1].value = { files: [] } // wrap into dict to avoid issues on validation
	if (!Array.isArray(inputData[1].all) || !inputData[1].all) {
		log.error("MODEL_LIST: 'all is invalid")
		// overwrite `all`
		inputData[1].all = []
	}

	const widget = HIDDEN(node, inputName, inputData)
	widget.all = inputData[1].all
	return widget
}
