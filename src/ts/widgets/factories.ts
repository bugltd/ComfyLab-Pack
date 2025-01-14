import { LGraphNode, IWidget, Vector2 } from '@comfyorg/litegraph'

import { app } from '~/.mock/scripts/app.js'
import { ComfyWidgets } from '~/.mock/scripts/widgets.js'

import { findWidget, makeWidgetAsync } from '~/shared/utils.js'

interface ITextWidgetOptions {
	multiline?: boolean
	placeholder?: string
	default?: string
	label?: string
	tooltip?: string
	disabled?: boolean
	domStyle?: Record<string, unknown>
}

export function makeTextWidget(
	node: LGraphNode,
	name: string,
	options: ITextWidgetOptions = {},
): IWidget<string> {
	// extract the options sent to ComfyWidgets
	const widgetOptions = ['multiline', 'placeholder'].reduce(
		(obj: Record<string, unknown>, optKey) => {
			if (optKey in options)
				obj[optKey] = options[optKey as keyof ITextWidgetOptions]
			return obj
		},
		{},
	)
	const widget = ComfyWidgets['STRING'](
		node,
		name,
		['STRING', widgetOptions],
		// @ts-expect-error: issue with #private in ComfyApp definition
		app,
	).widget
	if (options.default) widget.value = options.default
	if (options.label) widget.label = options.label
	if (options.tooltip) {
		if (options.multiline) widget.inputEl.title = options.tooltip
		else widget.tooltip = options.tooltip
	}
	if (options.disabled) {
		if (!options.multiline) widget.disabled = true
		else {
			widget.inputEl.readOnly = true
			widget.inputEl.style.border = 'none'
			// widget.inputEl.style.backgroundColor = 'transparent'
			widget.inputEl.style.opacity = 0.6
		}
	}
	if (options.multiline && options.domStyle)
		for (const [styleKey, styleValue] of Object.entries(options.domStyle)) {
			widget.inputEl.style[styleKey] = styleValue
		}
	return widget
}

interface IButtonWidgetOptions {
	tooltip?: string
	disabled?: boolean
	async?: boolean
	callback?: () => void | Promise<void>
}

export function makeButtonWidget(
	node: LGraphNode,
	name: string,
	label: string,
	options: IButtonWidgetOptions = {},
): IWidget {
	options = Object.assign(
		{
			async: true,
		},
		options,
	)
	const widget = node.addWidget('button', name, 0, () => {})
	widget.label = label
	if (options.tooltip) widget.tooltip = options.tooltip
	if (options.disabled) widget.disabled = options.disabled

	if (options.async) makeWidgetAsync(widget)
	if (options.callback) widget.callback = options.callback
	return widget
}

interface IToggleWidgetOptions {
	default?: boolean
	label_on?: string
	label_off?: string
	label?: string
	tooltip?: string
	disabled?: boolean
	callback?: () => void | Promise<void>
}

export function makeToggleWidget(
	node: LGraphNode,
	name: string,
	options: IToggleWidgetOptions = {},
): IWidget {
	// extract the options sent to ComfyWidgets
	const widgetOptions = ['default', 'label_on', 'label_off'].reduce(
		(obj: Record<string, unknown>, optKey) => {
			if (optKey in options)
				obj[optKey] = options[optKey as keyof IToggleWidgetOptions]
			return obj
		},
		{},
	)
	const widget = ComfyWidgets['BOOLEAN'](
		node,
		name,
		['STRING', widgetOptions],
		// @ts-expect-error: issue with #private in ComfyApp definition
		app,
	).widget
	if (options.label) widget.label = options.label
	if (options.tooltip) widget.tooltip = options.tooltip
	if (options.disabled) widget.disabled = options.disabled
	if (options.callback) widget.callback = options.callback
	return widget
}

type ComboChoices = string[] | { [key in string]: string }
type ComboSelected<T extends ComboChoices> = keyof T
type ComboValue<T extends ComboChoices> = T extends string[]
	? T[number]
	: T[keyof T]
export type IComboWidget<T extends ComboChoices> = IWidget<string> & {
	choices: T
	selected: ComboSelected<T>
	onSelected?: (selected: ComboSelected<T>) => void | Promise<void>
}

export function makeComboWidget<T extends ComboChoices = string[]>(
	node: LGraphNode,
	name: string,
	choices: T,
	defaultSelected: ComboSelected<T>,
	onSelected?: (
		selected: ComboSelected<T>,
		label: ComboValue<T>,
	) => void | Promise<void>,
	tooltip?: string,
): IComboWidget<T> {
	const getSelected = (label: ComboValue<T>): ComboSelected<T> | undefined => {
		if (Array.isArray(choices))
			return choices.indexOf(label) as ComboSelected<T>
		else {
			for (const [key, val] of Object.entries(choices)) {
				if (val === label) return key as ComboSelected<T>
			}
		}
	}
	const labels = Array.isArray(choices) ? choices : Object.values(choices)
	const widget = node.addWidget(
		'combo',
		name,
		choices[defaultSelected],
		() => {}, //replaced below by an async function
		{ values: labels },
	)
	widget.choices = choices
	widget.selected = defaultSelected
	widget.onSelected = onSelected
	// use an EventTarget to allow async callback, and replace default one
	makeWidgetAsync(widget)
	widget.callback = async (label: ComboValue<T>) => {
		widget.selected = getSelected(label)
		if (widget.onSelected) await widget.onSelected(widget.selected, label)
	}

	if (tooltip) widget.tooltip = tooltip

	// enssure we reload the values at node.onConfigure
	const original_onNodeConfigure = node.onConfigure
	node.onConfigure = function (...args: unknown[]) {
		widget.selected = getSelected(widget.value)
		original_onNodeConfigure?.apply(this, ...args)
	}

	return widget
}

function setWidgetVisible(widget: IWidget, type: string) {
	if (type === 'hidden') {
		widget.hidden = true
		widget.type = 'hidden'
		widget.computedHeight = null
		if (widget.element) {
			widget.element.style.display = 'none'
			widget.element.dataset.shouldHide = true
		}
		widget.computeSize = () => [0, -4]
	} else {
		delete widget.hidden
		delete widget.computeSize
		widget.type = type
		if (widget.element) {
			widget.element.style.display = null
			widget.element.dataset.shouldHide = false
		}
	}
}

export interface ISwitchState {
	current: boolean
	states: {
		true: {
			size: Vector2 | undefined
			members: Record<string, string> // widget name: type
		}
		false: {
			size: Vector2 | undefined
			members: Record<string, string> // widget name: type
		}
	}
}

export type ISwitchWidget = IWidget<ISwitchState> & {
	switch: (current: boolean, initial?: boolean) => void
	saveSize: () => void
	guard: (fct: () => void | Promise<void>) => Promise<void>
}

/**
 * Create an hidden widget, to switch visibility of one or two groups of widgets. \
 * Use the `switch()` method to switch from one group to the other. \
 * Note: This widget is meant to be serialized, to ensure proper reload on page refresh.
 * @param node node
 * @param name widget name
 * @param widgetGroup1 array of widgets to be visible, when current is `true`
 * @param widgetGroup2 optional: array of widgets to be visible, when current is `false`
 * @returns the widget
 */
export function makeSwitchWidget(
	node: LGraphNode,
	name: string,
	widgetGroup1: IWidget[],
	widgetGroup2: IWidget[] = [],
): ISwitchWidget {
	// save the widget type, as we will override it later
	const serializeWidgets = (widgetGroup: IWidget[]) => {
		return widgetGroup
			.filter((w: IWidget) => w.name !== name)
			.reduce((acc, w: IWidget) => {
				acc[w.name] = w.type
				return acc
			}, {})
	}
	// initialValue: store widget types, useful when making them visible
	const initialValue: ISwitchState = {
		current: true,
		states: {
			true: {
				size: undefined,
				members: serializeWidgets(widgetGroup1),
			},
			false: {
				size: undefined,
				members: serializeWidgets(widgetGroup2),
			},
		},
	}
	// create the hidden widget
	const widget: ISwitchWidget = node.addWidget(
		'hidden',
		name,
		initialValue,
		() => {},
	)
	widget.computeSize = () => [0, -4]

	/**
	 * Toggle visiblity from one group to the other.
	 * @param value if `true`, group1 is visible, group2 otherwise
	 * @param initial do not store current size, useful in `node.onConfigure()`
	 */
	widget.switch = (value: boolean) => {
		// save current value
		widget.value.current = value
		const states = widget.value.states
		// toggle groups visibility
		// widgets to make visible: restore type
		for (const [widgetName, widgetType] of Object.entries(
			states[value].members,
		)) {
			const w = findWidget(node, widgetName)
			if (w) {
				setWidgetVisible(w, widgetType as string)
			}
		}
		// widget to make invisible
		for (const widgetName of Object.keys(states[!value].members)) {
			const w = findWidget(node, widgetName)
			if (w) {
				setWidgetVisible(w, 'hidden')
			}
		}
		// reset position for all widgets, to force recalculation
		for (const w of node.widgets) {
			delete w.y
			delete w.last_y
		}
		// adjust node height; if not known, let computeSize() do the job
		const height = states[value].size?.[1] || node.computeSize()[1]
		node.setSize([node.size[0], height] as Vector2) // this triggers onResize()
		// we do not save size here, saveSize is called by onResize (see below)
	}
	widget.saveSize = () => {
		widget.value.states[widget.value.current].size = [
			node.size[0],
			node.size[1],
		]
	}

	// register to node,onResize
	const original_onResize = node.onResize
	node.onResize = function (size: Vector2) {
		original_onResize?.apply(this, size)
		// reset position for all widgets, to force recalculation
		for (const w of this.widgets) {
			delete w.y
			delete w.last_y
			delete w.computedHeight
		}
		widget.saveSize()
	}

	// restore state on page refresh
	const original_onConfigure = node.onConfigure
	node.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		widget.switch(widget.value.current)
	}

	/**
	 * Temporarily switch off then on, to let a function be executed.
	 * This is useful when creating new outputs for example.
	 * @param fct function to be executed
	 */
	widget.guard = async (fct: () => void | Promise<void>) => {
		// make content invisible if applicable
		const contentVisible = widget.value.current
		const oldSize = [node.size[0], node.size[1]]
		const oldComputedSize = node.computeSize()
		if (contentVisible) widget.switch(false)
		await fct()
		// restore content visibility if applicable
		if (contentVisible) widget.switch(true)
		// keep previous width, and increase/decrease height depending on new outputs
		const newComputedSize = node.computeSize()
		// use setSize(), to ensure saveSize() is called
		node.setSize([
			oldSize[0],
			oldSize[1] + newComputedSize[1] - oldComputedSize[1],
		])
	}

	widget.switch(widget.value.current) // only useful on node creation

	return widget as ISwitchWidget
}
