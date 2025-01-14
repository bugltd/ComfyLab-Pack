import type { LGraphNode } from '@comfyorg/litegraph'
import type { ComfyApp } from '@comfyorg/comfyui-frontend-types'

import { api } from '~/.mock/scripts/api.js'
import type { InputSpec } from '~/.d.ts/comfyui-frontend-types_alt.js'

interface IQueueData {
	index: number
	total: number
}
interface IQueueMessage {
	index: [number]
	total: [number]
}
function isQueueMessage(message: unknown): message is IQueueMessage {
	const msg = message as IQueueMessage
	return (
		Array.isArray(msg.index) &&
		msg.index.length === 1 &&
		typeof msg.index[0] === 'number' &&
		Array.isArray(msg.total) &&
		msg.total.length === 1 &&
		typeof msg.total[0] === 'number'
	)
}
function queueMessageToData(message: IQueueMessage): IQueueData {
	return {
		index: message.index[0],
		total: message.total[0],
	}
}

export function QUEUE_STATUS(
	node: LGraphNode,
	inputName: string,
	_inputData: InputSpec,
	app: ComfyApp | undefined, // forced to accept undefined as per ComfyWidgetConstructor
) {
	if (!app) throw new Error('QUEUE_STATUS: app is undefined')
	const widget = node.addWidget('button', inputName, 0, () => {})

	const reset = () => {
		widget.value = 0
		widget.total = undefined
	}

	// set initial value
	reset()
	widget.label = 'Ready'

	// handle page refresh: onConfigure is called after onNodeCreated, after applying serialized values, so we force reset here
	const originalOnConfigure = node.onConfigure
	node.onConfigure = function () {
		originalOnConfigure?.apply(this)
		reset()
	}

	const originalOnExecuted = node.onExecuted
	node.onExecuted = function (message: unknown) {
		originalOnExecuted?.apply(this, message)
		if (isQueueMessage(message)) {
			const data = queueMessageToData(message as IQueueMessage)
			if (!widget.total) widget.total = data.total
			if (data.index < data.total - 1) {
				widget.value = data.index + 1
				widget.label = `Processing: ${widget.value} / ${widget.total}`
				app.queuePrompt(0, 1)
			} else {
				widget.label = `Processing: ${widget.value + 1} / ${widget.total}`
				// wait for the execution to end before displaying the "Complete" label; note: the listener will be automatically deleted after use
				api.addEventListener(
					'execution_success',
					() => {
						widget.label = `Complete: ${widget.total} / ${widget.total}`
						reset()
					},
					{ once: true },
				)
			}
		}
	}

	// handle API interruptions and errors
	const original_api_interrupt = api.interrupt
	api.interrupt = async function (...args) {
		await original_api_interrupt.apply(this, ...args)
		widget.label = 'Interrupted'
		reset()
	}
	api.addEventListener('execution_error', () => {
		widget.label = 'Error detected'
		reset()
	})

	return widget
}
