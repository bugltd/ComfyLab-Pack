import type {
	LGraphNode,
	IWidget,
	INodeInputSlot,
	INodeOutputSlot,
} from '@comfyorg/litegraph'

import { api } from '~/.mock/scripts/api.js'
import { $el } from '~/.mock/scripts/ui.js'
import { ComfyAsyncDialog } from '~/.mock/scripts/ui/components/asyncDialog.js'

export const findWidget = (
	node: LGraphNode,
	name: string,
): IWidget | undefined => {
	return node.widgets?.find((w: IWidget) => w.name === name)
}
export const findWidgetIndex = (
	node: LGraphNode,
	name: string,
): number | undefined => {
	return node.widgets?.findIndex((w: IWidget) => w.name === name)
}
export const findInput = (
	node: LGraphNode,
	name: string,
): INodeInputSlot | undefined => {
	return node.inputs?.find((i: INodeInputSlot) => i.name === name)
}
export const findWidgetOrInput = (
	node: LGraphNode,
	name: string,
): IWidget | INodeInputSlot | undefined => {
	return findWidget(node, name) || findInput(node, name)
}
export const findOutput = (
	node: LGraphNode,
	name: string,
): INodeOutputSlot | undefined => {
	return node.outputs?.find((o: INodeOutputSlot) => o.name === name)
}
export const removeWidget = (node: LGraphNode, name: string): boolean => {
	const index = findWidgetIndex(node, name)
	if (index && index >= 0) {
		const widget = node.widgets[index]
		node.widgets.splice(index, 1)
		widget?.onRemove()
		node.size = node.computeSize()
		node.setDirtyCanvas(true, true)
		return true
	} else return false
}
export function removeAllOutputs(node: LGraphNode) {
	while (node.outputs?.length > 0) {
		node.removeOutput(0)
	}
}

type NodeLookupMode = 'id' | 'title' | 'type'
export function lookupNodes(
	key: string | number,
	by?: NodeLookupMode | NodeLookupMode[],
	except?: LGraphNode,
): LGraphNode[] {
	let modes: NodeLookupMode[] = []
	if (!by) modes = ['id', 'title', 'type']
	else if (Array.isArray(by)) modes = by
	else modes = [by]

	const strKey = String(key)
	const found: Set<LGraphNode> = new Set()
	for (const mode of modes) {
		if (mode === 'id' && !isNaN(+strKey) && Number.isInteger(+strKey)) {
			const node: LGraphNode | undefined = app.graph._nodes_by_id[+strKey]
			if (node && node !== except) found.add(node)
		} else {
			for (const node of app.graph._nodes) {
				if (node[mode] === strKey && node !== except) found.add(node)
			}
		}
	}
	return Array.from(found)
}

export const slotShapes = {
	box: 1,
	// round: 2,
	circle: 3,
	// card: 4,s
	arrow: 5,
	grid: 6,
} as const

class ConfigError extends Error {}
export async function fetchApi(
	entry: string,
	method: 'GET' | 'POST',
	params: Record<string, unknown>,
) {
	const response = await api.fetchApi('/comfylab/' + entry, {
		method,
		body: JSON.stringify(params),
	})
	if (!response.ok) {
		switch (response.status) {
			case 404:
				throw new ConfigError('File not found')
			case 415:
				throw new ConfigError(response.statusText)
			case 500:
				throw new ConfigError(`Internal error: ${response.statusText}`)
			default:
				throw new ConfigError(response.statusText)
		}
	}
	return await response.json()
}

type IRetrievedFile = {
	filename: string
	content: string
	mime: string
	encoding: string
}
export async function retrievefile(path: string): Promise<IRetrievedFile> {
	const body = await fetchApi('load_file', 'POST', { path })
	return {
		filename: body.filename,
		content: body.content,
		mime: body.mime,
		encoding: body.encoding,
	}
}

export function saveToTextFile(
	filename: string,
	content: string,
	accept = 'text/plain',
) {
	const blob = new Blob([content], { type: accept + ';charset=utf-8' }),
		anchor = document.createElement('a')

	anchor.download = filename
	anchor.href = (window.webkitURL || window.URL).createObjectURL(blob)
	anchor.dataset.downloadurl = [accept, anchor.download, anchor.href].join(':')
	anchor.click()
	anchor.remove()
}

export async function loadTextFile(
	accept = 'text/plain',
): Promise<{ content: string; name: string; type: string } | undefined> {
	return new Promise((resolve) => {
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = accept
		input.style.display = 'none'
		const reader = new FileReader()

		let name: string | undefined = undefined
		let contentType: string | undefined = undefined

		reader.addEventListener(
			'load',
			() => {
				resolve({
					content: reader.result as string,
					name: name as string,
					type: contentType as string,
				})
			},
			{ once: true },
		)
		reader.addEventListener(
			'abort',
			() => {
				resolve(undefined)
			},
			{ once: true },
		)
		reader.addEventListener(
			'error',
			() => {
				resolve(undefined)
			},
			{ once: true },
		)

		input.addEventListener(
			'change',
			(e: Event) => {
				const target = e.target as HTMLInputElement
				if (target.files) {
					const file = target.files[0]
					name = file.name
					contentType = file.type
					reader.readAsText(file)
				} else resolve(undefined)
			},
			{ once: true },
		)
		input.addEventListener(
			'cancel',
			() => {
				resolve(undefined)
			},
			{ once: true },
		)
		input.click()
		input.remove()
	})
}

export async function showErrorDialog({
	title = '',
	subtitle = '',
	centerSubtitle = false,
	content = [] as HTMLElement | HTMLElement[],
	centerContent = false,
}) {
	const elements = []
	if (title) {
		elements.push(
			$el(
				'div',
				{
					style: {
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						color: '#8c8c8c',
					},
				},
				[$el('h3', title)],
			),
		)
	}
	if (subtitle) {
		let subtitleEl = $el('h4', subtitle)
		if (centerSubtitle) {
			subtitleEl = $el(
				'div',
				{
					style: {
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					},
				},
				[subtitleEl],
			)
		}
		elements.push(subtitleEl)
	}
	if (content) {
		if (!Array.isArray(content)) content = [content]
		if (centerContent) {
			content = [
				$el(
					'div',
					{
						style: {
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						},
					},
					content,
				),
			]
		}
		elements.push(...content)
	}

	const dialog = new ComfyAsyncDialog()
	const res = await dialog.showModal(elements)
	dialog.element.remove()
	return res
}

/**
 * Workaround for a strange behavior (bug?), encountered in OutputConfigBackend,
 * where widgets values are not saved until there is a mouse event (anything: click on node / canvas, ...). \
 * So here basically we simulate a mouse event...
 */
export function forceMouseEvent() {
	app.canvas.processMouseUp(new MouseEvent('mouseup'))
}

/**
 * Allow a widget to define an async callback, as it is not possible by default
 * @param widget widget
 */
export function makeWidgetAsync<TValue>(widget: IWidget<TValue>) {
	if (widget._event) return

	// replace callback with events
	widget._event = {
		target: new EventTarget(),
		callback: widget.callback,
	}
	delete widget.callback
	widget._event.target.addEventListener('change', async (ev: CustomEvent) => {
		if (widget._event.callback) {
			await widget._event.callback(ev.detail)
		}
	})
	Object.defineProperty(widget, 'callback', {
		get() {
			return (value: TValue) => {
				widget._event.target.dispatchEvent(
					new CustomEvent('change', { detail: value }),
				)
			}
		},
		set(cb: () => void | Promise<void>) {
			widget._event.callback = cb
		},
		enumerable: true,
	})
}

export const ALL_CONFIG_FILE_TYPES =
	'.json,.jsonc,.json5,.yaml,.yml,application/JSON,application/json5,application/yaml'
export const humanFileType = (mimeType: string) => {
	mimeType = mimeType.toLowerCase()
	if (mimeType.includes('json5')) return 'json5'
	if (mimeType.includes('json')) return 'json'
	if (mimeType.includes('yaml')) return 'yaml'
	return ''
}
export const guessFileType = (filename: string) => {
	const ext: string = filename.split('.').pop() || ''
	if (ext === 'json5') return 'file: (json5)'
	if (ext === 'json' || ext === 'jsonc') return 'file: (json)'
	else if (['yml', 'yaml'].includes(ext)) return 'file: (yaml)'
	return 'file:'
}
