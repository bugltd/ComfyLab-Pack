import type { LGraphNode, IWidget } from '@comfyorg/litegraph'

import {
	findWidget,
	ALL_CONFIG_FILE_TYPES,
	humanFileType,
	guessFileType,
	loadTextFile,
	retrievefile,
	forceMouseEvent,
	removeAllOutputs,
} from '~/shared/utils.js'
import {
	makeTextWidget,
	makeButtonWidget,
	makeToggleWidget,
	type ISwitchWidget,
	makeSwitchWidget,
} from '~/widgets/factories.js'
import { ERROR_DISPLAY, type ErrorDisplayChoices } from '~/widgets/misc.js'
import { type IConfigValidationResult } from '~/shared/config.common.js'
import {
	type IOutputParsed,
	type IOutputErrors,
	processOutputConfigLocal,
} from '~/shared/config.output.js'
import { displaySingleError, displayErrorDict } from '~/shared/error.js'

async function processOutputResult(
	node: LGraphNode,
	result: IConfigValidationResult<IOutputParsed, IOutputErrors>,
	dataWidget: IWidget,
	statusWidget: IWidget,
	errorDisplay: ErrorDisplayChoices,
) {
	if (!result) return // empty path or config
	const title = node.title || node.type
	switch (result.success) {
		case false:
			dataWidget.value = {}
			statusWidget.label = result.error
			await displaySingleError(title, errorDisplay, result.error)
			break
		case true:
			dataWidget.value = result.data
			statusWidget.label = 'All outputs generated'
			break
		case 'partial': {
			dataWidget.value = result.data
			const message = `${result.nbErrors} error${result.nbErrors > 1 ? 's' : ''} detected`
			statusWidget.label = message
			await displayErrorDict(title, errorDisplay, result.errors, message)
		}
	}
}

async function processOutputConfigUI(
	node: LGraphNode,
	switchWidget: ISwitchWidget,
	configWidget: IWidget<string>,
	dataWidget: IWidget,
	statusWidget: IWidget,
	errorDisplayWidget: IWidget,
) {
	let res
	await switchWidget.guard(async () => {
		// generate outputs
		res = await processOutputConfigLocal(node, configWidget.value || undefined)
	})

	// process result
	const result = res as IConfigValidationResult<IOutputParsed, IOutputErrors>
	if (!result || result.success === false) configWidget.value = ''
	await processOutputResult(
		node,
		result,
		dataWidget,
		statusWidget,
		errorDisplayWidget.selected,
	)
	// save statusWidget label to value, to ensure it is serialized and restored on page refresh
	statusWidget.value = statusWidget.label
}

export function OutputConfigBackend(
	nodeType: LGraphNode,
	// _nodeData: ComfyNodeDef,
	// app: ComfyApp,
) {
	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		// get existing widgets and add the button
		const pathWidget = makeTextWidget(this, 'file_path', {
			multiline: false,
			placeholder: 'path to file (backend)',
			default: '',
			tooltip: 'full path to file (backend)',
		})
		const retrieveButtonWidget = makeButtonWidget(
			this,
			'retrieve',
			'Retrieve output config',
			{
				disabled: true,
				tooltip: 'retrieve output config from a backend JSON or YAML file',
			},
		)
		const errorDisplayWidget = ERROR_DISPLAY(this)
		const showConfigWidget = makeToggleWidget(this, 'show_config', {
			default: true,
		})
		const configWidget = makeTextWidget(this, 'config', {
			multiline: true,
			placeholder: 'output config',
			default: '',
			tooltip: 'output config as JSON or YAML',
			disabled: true,
		})
		const filenameWidget = makeTextWidget(this, 'filename', {
			multiline: false,
			disabled: true,
			label: 'no file',
		})
		const statusWidget = makeButtonWidget(this, 'status', 'No file selected', {
			tooltip: 'status',
			disabled: true,
		})
		const switchWidget = makeSwitchWidget(this, 'switch', [configWidget])
		const dataWidget = findWidget(this, 'data')
		// implement logic
		pathWidget.callback = (text: string) => {
			retrieveButtonWidget.disabled = !text
		}
		showConfigWidget.callback = (value: boolean) => {
			switchWidget.switch(value)
		}
		retrieveButtonWidget.callback = async () => {
			// load file content to config widget
			filenameWidget.label = 'no file'
			filenameWidget.value = ''
			configWidget.value = ''
			statusWidget.label = 'Retrieving file...'
			try {
				const retrieved = await retrievefile(pathWidget.value)
				filenameWidget.label = `file: (${humanFileType(retrieved.mime)})`
				filenameWidget.value = retrieved.filename
				configWidget.value = retrieved.content
				await processOutputConfigUI(
					this,
					switchWidget,
					configWidget,
					dataWidget,
					statusWidget,
					errorDisplayWidget,
				)
			} catch (e) {
				statusWidget.label = (e as Error).message
				dataWidget.value = {}
				await switchWidget.guard(async () => {
					removeAllOutputs(this)
					for (const w of this.widgets) {
						delete w.y
						delete w.last_y
					}
				})
				await displaySingleError(
					this.title || this.type,
					errorDisplayWidget.selected,
					(e as Error).message,
				)
			} finally {
				// strange behavior here: the widgets values are not saved, until there is any sort of mouse event.
				// that can be select node, resize it, activate a widget, even just click on canvas.
				// this doesn't seem to appear on exception catch, but just in case we put that in a finally block.
				forceMouseEvent()
			}
		}
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		console.log('OutputConfigBackend / onConfigure')
		// restore file and status labels
		const statusWidget = findWidget(this, 'status')
		if (statusWidget.value) statusWidget.label = statusWidget.value
		const filenameWidget = findWidget(this, 'filename')
		filenameWidget.label = 'no file'
		if (filenameWidget.value) {
			// we do not have access to the MIME type anymore, so try to guess
			const ext = filenameWidget.value.split('.').pop()
			if (ext === 'json') filenameWidget.label = 'file: (json)'
			else if (['yml', 'yaml'].includes(ext))
				filenameWidget.label = 'file: (yaml)'
			else filenameWidget.label = 'file:'
		}
		// restore button state
		const retrieveButtonWidget = findWidget(this, 'retrieve')
		const pathWidget = findWidget(this, 'file_path')
		retrieveButtonWidget.disabled = !pathWidget.value
		// hide preview if needed
		const showConfigWidget = findWidget(this, 'show_config')
		if (!showConfigWidget.value) showConfigWidget.callback(false)
	}
}

export function OutputConfigLocal(
	nodeType: LGraphNode,
	// nodeData: ComfyNodeDef,
	// _app: ComfyApp,
) {
	const original_onNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		original_onNodeCreated?.apply(this, ...args)
		// define widgets here, to prevent them from being converted to inputs
		const loadButtonWidget = makeButtonWidget(
			this,
			'load',
			'Load output config',
			{
				tooltip: 'load output config from a local JSON or YAML file',
			},
		)
		const errorDisplayWidget = ERROR_DISPLAY(this)
		const showConfigWidget = makeToggleWidget(this, 'show_config', {
			default: true,
		})
		const configWidget = makeTextWidget(this, 'config', {
			multiline: true,
			placeholder: 'output config',
			default: '',
			tooltip: 'output config as JSON or YAML',
			disabled: true,
		})
		const filenameWidget = makeTextWidget(this, 'filename', {
			multiline: false,
			disabled: true,
			label: 'no file',
		})
		const statusWidget = makeButtonWidget(this, 'status', 'No file selected', {
			tooltip: 'status',
			disabled: true,
		})
		const switchWidget = makeSwitchWidget(this, 'switch', [configWidget])
		const dataWidget = findWidget(this, 'data')
		// implement logic
		showConfigWidget.callback = (value: boolean) => {
			switchWidget.switch(value)
		}
		loadButtonWidget.callback = async () => {
			try {
				const loaded = await loadTextFile(ALL_CONFIG_FILE_TYPES)
				if (loaded) {
					filenameWidget.label = `file: (${humanFileType(loaded.type)})`
					filenameWidget.value = loaded.name
					configWidget.value = loaded.content
				} else {
					return
				}
			} catch (e) {
				statusWidget.label = (e as Error).message
				configWidget.value = ''
				dataWidget.value = {}
				await switchWidget.guard(async () => {
					removeAllOutputs(this)
					for (const w of this.widgets) {
						delete w.y
						delete w.last_y
					}
				})
				await displaySingleError(
					this.title || this.type,
					errorDisplayWidget.selected,
					'Content is not JSON or YAML',
				)
				return
			}

			await processOutputConfigUI(
				this,
				switchWidget,
				configWidget,
				dataWidget,
				statusWidget,
				errorDisplayWidget,
			)
		}
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		// restore file and status labels
		const statusWidget = findWidget(this, 'status')
		if (statusWidget.value) statusWidget.label = statusWidget.value
		const filenameWidget = findWidget(this, 'filename')
		filenameWidget.label = 'no file'
		if (filenameWidget.value) {
			// we do not have access to the MIME type anymore, so try to guess
			filenameWidget.label = guessFileType(filenameWidget.value)
		}
		// hide preview if needed
		const showConfigWidget = findWidget(this, 'show_config')
		if (!showConfigWidget.value) showConfigWidget.callback(false)
	}
}
