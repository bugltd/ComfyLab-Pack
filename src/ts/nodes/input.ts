import type { LGraphNode } from '@comfyorg/litegraph'

import { findWidget, loadTextFile } from '~/shared/utils.js'

export function InputMultiline(
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
