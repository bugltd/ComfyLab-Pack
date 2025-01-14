import { fetchApi } from './utils.js'
import { IOutputParsed, IOutputErrors } from './config.output.js'
import {
	INodeConfigParsed,
	INodeConfigErrors,
} from '~/shared/experimental/config.node.js'
import {
	IMultiConfigParsed,
	IMultiConfigErrors,
} from '~/shared/experimental/config.multi.js'

export async function parseConfig(raw: string) {
	return await fetchApi('config_parse', 'POST', { raw })
}

export type ApiValidationError = [string[], string]
export type WidgetValue = string | number | boolean

export type IConfigValidationResult<
	TData extends IOutputParsed | INodeConfigParsed | IMultiConfigParsed,
	TErrors extends IOutputErrors | INodeConfigErrors | IMultiConfigErrors,
> =
	| {
			success: true
			data: TData
			applied: true
	  }
	| {
			success: 'partial'
			data: TData
			nbErrors: number
			errors: TErrors
			applied: boolean
	  }
	| {
			success: false
			error: string
	  }
	| void
