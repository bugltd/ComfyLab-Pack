import type { LGraphNode } from '@comfyorg/litegraph'

import { app } from '~/.mock/scripts/app.js'
import type { ComfyNodeDef } from '~/.d.ts/comfyui-frontend-types_alt.js'

import { CATEGORY, type GlobalThisWithCategory } from '~/shared/common.js'
import { customizeNode } from '~/custom.js'
import { setupDynamicConnections } from '~/shared/dynamic_connections.js'
import { QUEUE_STATUS } from '~/widgets/queue.js'
import { HIDDEN, BTN, ERROR_DISPLAY } from '~/widgets/misc.js'
import { OutputConfigBackend, OutputConfigLocal } from '~/nodes/config.js'
import {
	NodeConfigFetch,
	NodeConfigApplyLocal,
	MultiConfigFetch,
	MultiConfigApplyLocal,
} from '~/nodes/experimental/config.node_multi.js'
import { OutputConfigAuto } from '~/nodes/experimental/config.output.auto.js'
import { ListFromMultiline } from '~/nodes/list.js'
import { InputMultiline } from '~/nodes/input.js'
import { DebugJSONYAML, DebugWidgetVisibility } from '~/nodes/debug.js'

type GlobalThis = typeof globalThis & GlobalThisWithCategory
;(globalThis as GlobalThis)[CATEGORY] = { log: 'debug' }

app.registerExtension({
	name: 'ComfyLab.pack',
	async beforeRegisterNodeDef(
		nodeType: LGraphNode,
		nodeData: ComfyNodeDef,
		// _app: ComfyApp,
	) {
		// skip the node if it's not ours
		if (nodeData?.category?.split('/')[0] !== CATEGORY) {
			return
		}

		switch (nodeData.name) {
			// LIST
			case 'ListMerge':
				setupDynamicConnections(nodeType, 'list', 'LIST', {
					separator: ' ',
					start_index: 1,
				})
				break
			case 'ListFromElements':
				setupDynamicConnections(nodeType, 'element', '*', {
					separator: ' ',
					start_index: 1,
				})
				break
			// INPUT
			case 'InputMultiline':
				InputMultiline(nodeType)
				break
			// UTILS
			case 'FormatString':
			case 'FormatMultiline':
				setupDynamicConnections(nodeType, 'arg', 'STRING,INT,FLOAT,BOOLEAN', {
					separator: '',
					start_index: 0,
				})
				break
			case 'ListFromMultiline':
				ListFromMultiline(nodeType)
				break
			// DEBUG
			case 'DebugJSONYAML':
				DebugJSONYAML(nodeType)
				break
			case 'DebugWidgetVisibility':
				DebugWidgetVisibility(nodeType)
				break
			// CONFIG
			case 'OutputConfigBackend':
				OutputConfigBackend(nodeType)
				break
			case 'OutputConfigLocal':
				OutputConfigLocal(nodeType)
				break
			case 'OutputConfigAuto':
				OutputConfigAuto(nodeType)
				break
			case 'NodeConfigFetch':
				NodeConfigFetch(nodeType)
				break
			case 'NodeConfigApplyLocal':
				NodeConfigApplyLocal(nodeType)
				break
			case 'MultiConfigFetch':
				MultiConfigFetch(nodeType)
				break
			case 'MultiConfigApplyLocal':
				MultiConfigApplyLocal(nodeType)
				break
		}

		// customize labels and looks of widgets, input / output slots
		customizeNode(nodeType, nodeData)

		return nodeType
	},
	getCustomWidgets() {
		return {
			QUEUE_STATUS,
			HIDDEN,
			BTN,
			ERROR_DISPLAY,
		}
	},
})
