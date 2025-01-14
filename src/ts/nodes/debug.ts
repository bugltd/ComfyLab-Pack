import type { LGraphNode } from '@comfyorg/litegraph'

import { loadTextFile } from '~/shared/utils.js'
import {
	makeTextWidget,
	makeButtonWidget,
	makeToggleWidget,
	makeSwitchWidget,
} from '~/widgets/factories.js'
import { parseConfig } from '~/shared/config.common.js'
import { log } from '~/shared/common.js'

export function DebugJSONYAML(
	nodeType: LGraphNode,
	// nodeData: ComfyNodeDef,
	// _app: ComfyApp,
) {
	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		// load file
		const loadButtonWidget = makeButtonWidget(this, 'load', 'Load file', {
			tooltip: 'load a JSON or YAML file',
		})
		const fileTypeWidget = makeTextWidget(this, 'file_type', {
			multiline: false,
			placeholder: '',
			default: 'unknown',
			tooltip: 'content type as detected on file load',
		})
		fileTypeWidget.disabled = true
		const contentWidget = makeTextWidget(this, 'content', {
			multiline: true,
			placeholder: 'loaded content',
			default: '{}',
			tooltip: 'loaded content',
		})
		const parsedTypeWidget = makeTextWidget(this, 'parsed_type', {
			multiline: false,
			placeholder: '',
			default: 'unknown',
			tooltip: 'content type as detected on parse',
		})
		parsedTypeWidget.disabled = true

		// load file to text area
		loadButtonWidget.callback = async () => {
			fileTypeWidget.value = 'unknown'
			parsedTypeWidget.value = 'unknown'
			const loaded = await loadTextFile(
				'.json,.yaml,.yml,application/JSON,application/yaml',
			)
			if (loaded) {
				fileTypeWidget.value = loaded.type
				try {
					const parsed = await parseConfig(loaded.content)
					parsedTypeWidget.value = parsed.type
					contentWidget.value = parsed.prettified
				} catch (e) {
					parsedTypeWidget.value = (e as Error).message
					contentWidget.value = ''
				}
			}
			this.setDirtyCanvas(true)
		}
	}
}

export function DebugWidgetVisibility(
	nodeType: LGraphNode,
	// nodeData: ComfyNodeDef,
	// _app: ComfyApp,
) {
	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		// add widgets
		makeButtonWidget(this, 'button1', 'a button', {})
		const showWidget = makeToggleWidget(this, 'show', {
			default: true,
		})
		const multi1Widget = makeTextWidget(this, 'multiline1', {
			multiline: true,
			default: 'multiline1',
		})
		const text1Widget = makeTextWidget(this, 'text1', {
			multiline: false,
			default: 'string #1',
		})
		const text2Widget = makeTextWidget(this, 'text2', {
			multiline: false,
			default: 'string #2',
		})
		const multi2Widget = makeTextWidget(this, 'multiline2', {
			multiline: true,
			default: 'multiline2',
		})
		makeTextWidget(this, 'footer', {
			multiline: false,
			default: 'footer',
		})
		const switchWidget = makeSwitchWidget(
			this,
			'switch',
			[multi1Widget, text1Widget],
			[text2Widget, multi2Widget],
		)
		// implement logic
		showWidget.callback = (value: boolean) => {
			switchWidget.switch(value)
			log.debug('switch value', switchWidget.value)
		}
	}
}
