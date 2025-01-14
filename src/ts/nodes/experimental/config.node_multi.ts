import type { LGraphNode } from '@comfyorg/litegraph'

import {
	findWidget,
	ALL_CONFIG_FILE_TYPES,
	humanFileType,
	guessFileType,
	saveToTextFile,
	loadTextFile,
} from '~/shared/utils.js'
import {
	makeTextWidget,
	makeButtonWidget,
	makeToggleWidget,
	makeSwitchWidget,
	makeComboWidget,
} from '~/widgets/factories.js'
import { NODE_COMBO, ERROR_DISPLAY } from '~/widgets/misc.js'
import {
	fetchNodeConfig,
	NODECONFIG_CHECK_LEVELS,
	applyNodeConfig,
} from '~/shared/experimental/config.node.js'
import {
	fetchMultiConfig,
	applyMultiConfig,
	MULTICONFIG_NODE_BY,
	MULTICONFIG_CHECK_LEVELS,
} from '~/shared/experimental/config.multi.js'
import { displaySingleError, displayErrorDict } from '~/shared/error.js'

export function NodeConfigFetch(
	nodeType: LGraphNode,
	// nodeData: ComfyNodeDef,
	// _app: ComfyApp,
) {
	// define widgets here, to prevent them from being converted to inputs
	const originalOnNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		originalOnNodeCreated?.apply(this, ...args)
		const nodeComboWidget = NODE_COMBO(this, 'node')
		const formatWidget = makeComboWidget(
			this,
			'format',
			['json', 'yaml'],
			0,
			undefined,
			'generate as JSON or YAML',
		)
		const configWidget = makeTextWidget(this, 'config', {
			multiline: true,
			placeholder: 'node config',
			default: '',
			tooltip: 'node config as JSON or YAML',
			disabled: true,
		})
		const saveWidget = makeButtonWidget(this, 'save', 'Save node config', {
			tooltip: 'save node config to a JSON or YAML file',
			disabled: true,
		})
		// update text on node select
		const dumpConfig = async () => {
			configWidget.value = await fetchNodeConfig(
				nodeComboWidget.selectedNode,
				formatWidget.value,
			)
			saveWidget.disabled = !nodeComboWidget.selectedNode
		}
		formatWidget.onSelected = async () => {
			dumpConfig()
		}
		nodeComboWidget.onSelected = async () => {
			dumpConfig()
		}
		// adjust save button callback
		saveWidget.callback = () => {
			const basename = nodeComboWidget.value
			const content = configWidget.value
			if (!basename || !content) return
			if (formatWidget.value === 'json')
				saveToTextFile(basename + '.json', content, 'application/JSON')
			else saveToTextFile(basename + '.yaml', content, 'application/yaml')
		}
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		// restore button state
		const nodeComboWidget = findWidget(this, 'node')
		const saveWidget = findWidget(this, 'save')
		saveWidget.disabled = !nodeComboWidget.selectedNode
	}
}

export function NodeConfigApplyLocal(
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
			'Load node config',
			{
				tooltip: 'load node config from a local JSON or YAMLfile',
			},
		)
		const showConfigWidget = makeToggleWidget(this, 'show_config', {
			default: true,
		})
		const configWidget = makeTextWidget(this, 'config', {
			multiline: true,
			placeholder: 'node config',
			default: '',
			tooltip: 'node config as JSON or YAML',
			disabled: true,
		})
		const filenameWidget = makeTextWidget(this, 'filename', {
			multiline: false,
			disabled: true,
			label: 'no file',
		})
		const nodeComboWidget = NODE_COMBO(this, 'node')
		const errorDisplayWidget = ERROR_DISPLAY(this)
		const checkLevelWidget = makeComboWidget(
			this,
			'check_level',
			NODECONFIG_CHECK_LEVELS,
			'any',
			() => {},
			'how strict is the validation',
		)
		const applyButtonWidget = makeButtonWidget(
			this,
			'apply',
			'Apply config to node',
			{ tooltip: 'apply JSON or YAML config to selected node', disabled: true },
		)
		const switchWidget = makeSwitchWidget(this, 'switch', [configWidget])
		// implement logic
		showConfigWidget.callback = (value: boolean) => {
			switchWidget.switch(value)
		}
		// enable button if a node is selected and content is not empty
		const enableButton = () => {
			applyButtonWidget.disabled =
				!configWidget.value || !nodeComboWidget.selectedNode
		}
		nodeComboWidget.onSelected = () => {
			enableButton()
		}
		loadButtonWidget.callback = async () => {
			// load file content to config widget
			filenameWidget.label = 'no file'
			filenameWidget.value = ''
			configWidget.value = ''
			applyButtonWidget.label = 'Apply config to node'
			const loaded = await loadTextFile(ALL_CONFIG_FILE_TYPES)
			if (loaded) {
				filenameWidget.label = `file: (${humanFileType(loaded.type)})`
				filenameWidget.value = loaded.name
				configWidget.value = loaded.content
				enableButton()
			}
		}
		// apply config
		applyButtonWidget.callback = async () => {
			if (!nodeComboWidget.selectedNode || !configWidget.value) return
			const result = await applyNodeConfig(
				nodeComboWidget.selectedNode,
				configWidget.value,
				checkLevelWidget.selected,
			)
			if (!result) return // empty config
			const title = this.title || this.type
			switch (result.success) {
				case false:
					applyButtonWidget.label = result.error
					await displaySingleError(
						title,
						errorDisplayWidget.selected,
						result.error,
					)
					break
				case true:
					applyButtonWidget.label = 'All values applied'
					break
				case 'partial': {
					let message = result.applied
						? `Applied: ${Object.keys(result.data).length}`
						: 'Not applied'
					message += ` - ${result.nbErrors} error${result.nbErrors > 1 ? 's' : ''}`
					applyButtonWidget.label = message
					await displayErrorDict(
						title,
						errorDisplayWidget.selected,
						result.errors,
						message,
					)
				}
			}
		}
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		// restore button state
		const nodeComboWidget = findWidget(this, 'node')
		const configWidget = findWidget(this, 'config')
		const applyButtonWidget = findWidget(this, 'apply')
		applyButtonWidget.disabled =
			!configWidget.value || !nodeComboWidget.selectedNode
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

export function MultiConfigFetch(
	nodeType: LGraphNode,
	// nodeData: ComfyNodeDef,
	// _app: ComfyApp,
) {
	// define widgets here, to prevent them from being converted to inputs
	const originalOnNodeCreated = nodeType.prototype.onNodeCreated
	nodeType.prototype.onNodeCreated = function (...args: unknown[]) {
		originalOnNodeCreated?.apply(this, ...args)
		const nodeByWidget = makeComboWidget(
			this,
			'node_by',
			MULTICONFIG_NODE_BY,
			'id',
			undefined,
			'how to identify nodes in config\nwhen identifying by title or name, duplicates will be discarded to avoid ambiguity',
		)
		const formatWidget = makeComboWidget(
			this,
			'format',
			['json', 'yaml'],
			0,
			undefined,
			'generate as JSON or YAML',
		)
		const configWidget = makeTextWidget(this, 'config', {
			multiline: true,
			placeholder: 'workflow config',
			default: '',
			tooltip: 'workflow config as JSON or YAML',
			disabled: true,
		})
		const saveWidget = makeButtonWidget(this, 'save', 'Save node config', {
			tooltip: 'save workflow config to a JSON or YAML file',
			disabled: true,
		})
		// implement logic
		const dumpConfig = async () => {
			configWidget.value = await fetchMultiConfig(
				this,
				nodeByWidget.selected,
				formatWidget.value,
			)
		}
		nodeByWidget.onSelected = async () => {
			await dumpConfig()
		}
		formatWidget.onSelected = async () => {
			await dumpConfig()
		}
		configWidget.callback = (value: string) => {
			saveWidget.disabled = !value
		}
		saveWidget.callback = async () => {
			const basename = 'workflow config'
			const content = configWidget.value
			if (!basename || !content) return
			if (formatWidget.value === 'json')
				saveToTextFile(basename + '.json', content, 'application/JSON')
			else saveToTextFile(basename + '.yaml', content, 'application/yaml')
		}
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		// regenerate content
		const nodeByWidget = findWidget(this, 'node_by')
		nodeByWidget.callback(nodeByWidget.value)
		// restore button state
		const configWidget = findWidget(this, 'config')
		const saveWidget = findWidget(this, 'save')
		saveWidget.disabled = !configWidget.value
	}
}

export function MultiConfigApplyLocal(
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
			'Load node config',
			{
				tooltip: 'load node config from a local JSON or YAMLfile',
			},
		)
		const showConfigWidget = makeToggleWidget(this, 'show_config', {
			default: true,
		})
		const configWidget = makeTextWidget(this, 'config', {
			multiline: true,
			placeholder: 'node config',
			default: '',
			tooltip: 'node config as JSON or YAML',
			disabled: true,
		})
		const filenameWidget = makeTextWidget(this, 'filename', {
			multiline: false,
			disabled: true,
			label: 'no file',
		})
		const errorDisplayWidget = ERROR_DISPLAY(this)
		const checkLevelWidget = makeComboWidget(
			this,
			'check_level',
			MULTICONFIG_CHECK_LEVELS,
			'any',
			() => {},
			'how strict is the validation',
		)
		const applyButtonWidget = makeButtonWidget(
			this,
			'apply',
			'Apply config to node',
			{ tooltip: 'apply JSON or YAML config to selected node', disabled: true },
		)
		const switchWidget = makeSwitchWidget(this, 'switch', [configWidget])
		// implement logic
		showConfigWidget.callback = (value: boolean) => {
			switchWidget.switch(value)
		}
		// enable button if a node is selected and content is not empty
		const enableButton = () => {
			applyButtonWidget.disabled = !configWidget.value
		}
		loadButtonWidget.callback = async () => {
			// load file content to config widget
			filenameWidget.label = 'no file'
			filenameWidget.value = ''
			configWidget.value = ''
			applyButtonWidget.label = 'Apply config to nodes'
			const loaded = await loadTextFile(ALL_CONFIG_FILE_TYPES)
			if (loaded) {
				filenameWidget.label = `file: (${humanFileType(loaded.type)})`
				filenameWidget.value = loaded.name
				configWidget.value = loaded.content
				enableButton()
			}
		}
		// apply config
		applyButtonWidget.callback = async () => {
			if (!configWidget.value) return
			const result = await applyMultiConfig(
				configWidget.value,
				checkLevelWidget.selected,
			)
			if (!result) return // empty config
			const title = this.title || this.type
			switch (result.success) {
				case false:
					applyButtonWidget.label = result.error
					await displaySingleError(
						title,
						errorDisplayWidget.selected,
						result.error,
					)
					break
				case true:
					applyButtonWidget.label = 'All values applied'
					break
				case 'partial': {
					let message = result.applied
						? `Applied: ${Object.keys(result.data).length}`
						: 'Not applied'
					message += ` - ${result.nbErrors} error${result.nbErrors > 1 ? 's' : ''}`
					applyButtonWidget.label = message
					await displayErrorDict(
						title,
						errorDisplayWidget.selected,
						result.errors,
						message,
					)
				}
			}
		}
	}

	const original_onConfigure = nodeType.prototype.onConfigure
	nodeType.prototype.onConfigure = function (...args: unknown[]) {
		original_onConfigure?.apply(this, ...args)
		// restore button state
		const configWidget = findWidget(this, 'config')
		const applyButtonWidget = findWidget(this, 'apply')
		applyButtonWidget.disabled = !configWidget.value
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
