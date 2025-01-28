import type { LGraphNode, IWidget } from '@comfyorg/litegraph'

import { findWidget, loadTextFile } from '~/shared/utils.js'
import { makeComboWidget } from '~/widgets/factories.js'

export function ListFromMultiline(
	nodeType: LGraphNode,
	// nodeData: ComfyNodeDef,
	// _app: ComfyApp,
) {
	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		// load file
		const loadButtonWidget = findWidget(this, 'load')
		const textWidget = findWidget(this, 'multiline')

		// load file to text area
		loadButtonWidget.callback = async () => {
			const loaded = await loadTextFile('text/*')
			if (loaded) {
				textWidget.value = loaded.content
			}
		}
	}
}

export function ListModels(nodeType: LGraphNode, model_type: string) {
	const isModelCombo = (widget: IWidget) =>
		widget.name.startsWith(`${model_type}_`.toLowerCase())

	const findModelCombos = (node: LGraphNode) =>
		node.widgets.filter((w: IWidget) => isModelCombo(w))

	const addModelCombo = (node: LGraphNode, modelList: IWidget) => {
		const index = findModelCombos(node).length
		const width = node.size[0]
		const widget = makeComboWidget(
			node,
			`${model_type}_${index}`.toLowerCase(),
			['none', ...modelList.all],
			0,
		)
		// keep node width
		node.setSize([width, node.size[1]])

		widget.label = `${model_type} #${index + 1}`
		widget.options.serialize = false
		return widget
	}

	const refreshModelList = (node: LGraphNode, modelList: IWidget) => {
		const files = []
		let widgetIndex = 0
		let comboIndex = 0
		while (widgetIndex < node.widgets.length) {
			const widget = node.widgets[widgetIndex]
			if (!isModelCombo(widget)) {
				widgetIndex += 1
				continue
			}
			if (widget.selected === 0) {
				node.widgets.splice(widgetIndex, 1)
				continue
			}
			// rename widget
			widget.name = `${model_type}_${comboIndex}`.toLowerCase()
			widget.label = `${model_type} #${comboIndex + 1}`
			// add to collected files
			files.push(widget.value)
			widgetIndex += 1
			comboIndex += 1
		}
		// add a new combo at the end
		const last = addModelCombo(node, modelList)
		last.onSelected = () => {
			refreshModelList(node, modelList)
		}

		modelList.value = { files } // wrap into dict to avoid issues on validation
	}

	// recreate widgets from modelList
	const refreshFromModelList = (node: LGraphNode, modelList: IWidget) => {
		// delete all combos widgets
		let widgetIndex = 0
		while (widgetIndex < node.widgets.length) {
			const widget = node.widgets[widgetIndex]
			if (isModelCombo(widget)) {
				node.widgets.splice(widgetIndex, 1)
				continue
			}
			widgetIndex += 1
		}
		// create combo widgets for modelList
		const files = modelList.value.files
		for (const file of files) {
			const widget = addModelCombo(node, modelList)
			widget.value = file
			// ensure widget.selected is valid
			widget.callback(widget.value)
			// only set onSelected now, to avoid having it called by prebious line
			widget.onSelected = () => {
				refreshModelList(node, modelList)
			}
		}
		// add a new combo at the end
		const last = addModelCombo(node, modelList)
		last.onSelected = () => {
			refreshModelList(node, modelList)
		}
	}

	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		const modelList = findWidget(this, 'models')
		refreshFromModelList(this, modelList)
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		const modelList = findWidget(this, 'models')
		refreshFromModelList(this, modelList)
	}
}
