import type { LGraphNode, IWidget } from '@comfyorg/litegraph'

import { findWidget, loadTextFile } from '~/shared/utils.js'
import { makeComboWidget, makeButtonWidget } from '~/widgets/factories.js'

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

export function ListFromSelection(
	nodeType: LGraphNode,
	selection_type: string,
) {
	const isCombo = (widget: IWidget) =>
		widget.name.startsWith(`${selection_type}_`.toLowerCase())

	const findCombos = (node: LGraphNode) =>
		node.widgets.filter((w: IWidget) => isCombo(w))

	const addCombo = (node: LGraphNode, selectionWidget: IWidget) => {
		const index = findCombos(node).length
		const width = node.size[0]
		const widget = makeComboWidget(
			node,
			`${selection_type}_${index}`.toLowerCase(),
			['none', ...selectionWidget.all],
			0,
		)
		// keep node width
		node.setSize([width, node.size[1]])

		widget.label = `${selection_type} #${index + 1}`
		widget.options.serialize = false
		return widget
	}

	const refreshSelection = (node: LGraphNode, selectionWidget: IWidget) => {
		const selected = []
		let widgetIndex = 0
		let comboIndex = 0
		while (widgetIndex < node.widgets.length) {
			const widget = node.widgets[widgetIndex]
			if (!isCombo(widget)) {
				widgetIndex += 1
				continue
			}
			if (widget.selected === 0) {
				node.widgets.splice(widgetIndex, 1)
				continue
			}
			// rename widget
			widget.name = `${selection_type}_${comboIndex}`.toLowerCase()
			widget.label = `${selection_type} #${comboIndex + 1}`
			// add to collected selected
			selected.push(widget.value)
			widgetIndex += 1
			comboIndex += 1
		}
		// add a new combo at the end
		const last = addCombo(node, selectionWidget)
		last.onSelected = () => {
			refreshSelection(node, selectionWidget)
		}

		selectionWidget.value = { selected } // wrap into dict to avoid issues on validation
	}

	// recreate widgets from selectionWidget
	const refreshFromSelection = (node: LGraphNode, selectionWidget: IWidget) => {
		// delete all combos widgets
		let widgetIndex = 0
		while (widgetIndex < node.widgets.length) {
			const widget = node.widgets[widgetIndex]
			if (isCombo(widget)) {
				node.widgets.splice(widgetIndex, 1)
				continue
			}
			widgetIndex += 1
		}
		// create combo widgets for selectionWidget
		const selected = selectionWidget.value.selected
		for (const value of selected) {
			const widget = addCombo(node, selectionWidget)
			widget.value = value
			// ensure widget.selected is valid
			widget.callback(widget.value)
			// only set onSelected now, to avoid having it called by prebious line
			widget.onSelected = () => {
				refreshSelection(node, selectionWidget)
			}
		}
		// add a new combo at the end
		const last = addCombo(node, selectionWidget)
		last.onSelected = () => {
			refreshSelection(node, selectionWidget)
		}
	}

	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		const selectionWidget = findWidget(this, 'selection')
		refreshFromSelection(this, selectionWidget)
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		const selectionWidget = findWidget(this, 'selection')
		refreshFromSelection(this, selectionWidget)
	}
}

export function ListRandomSeeds(nodeType: LGraphNode) {
	const reset = (widget: IWidget) => {
		widget.value = new Date().getTime()
	}

	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		const resetBtn = makeButtonWidget(this, 'reset_btn', 'Reset', {
			tooltip: 'reset seeds',
		})
		resetBtn.callback = () => {
			reset(resetBtn)
		}
		reset(resetBtn)
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		const resetBtn = findWidget(this, 'reset_btn')
		if (resetBtn) reset(resetBtn)
	}
}
