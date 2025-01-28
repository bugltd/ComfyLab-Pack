import type { LGraphNode, IWidget } from '@comfyorg/litegraph'
import { log } from '~/shared/common.js'

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
	const findModelCombos = (node: LGraphNode) =>
		node.widgets.filter((w: IWidget) => w.name.startsWith(model_type + '_'))

	const addModelCombo = (node: LGraphNode, modelList: IWidget) => {
		const index = findModelCombos(node).length
		const width = node.size[0]
		const widget = makeComboWidget(
			node,
			`${model_type}_${index}`.toLowerCase(),
			['none', ...modelList.all],
			0,
			() => {
				refreshModelList(node, modelList)
			},
		)
		// keep node width
		node.setSize([width, node.size[1]])

		widget.label = `${model_type} #${index + 1}`
		// widget.options.serialize = false
		return widget
	}

	const refreshModelList = (node: LGraphNode, modelList: IWidget) => {
		const files = []
		let widgetIndex = 0
		let comboIndex = 0
		while (widgetIndex < node.widgets.length) {
			const widget = node.widgets[widgetIndex]
			if (!widget.name.startsWith(model_type + '_')) {
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
			log.debug(widget.value)
			files.push(widget.value)
			widgetIndex += 1
			comboIndex += 1
		}
		// add a new combo at the end
		addModelCombo(node, modelList)

		modelList.value = { files } // wrap into dict to avoid issues on validation
		log.debug(modelList.value)
	}

	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		const modelList = findWidget(this, 'models')
		addModelCombo(this, modelList)
	}
}
