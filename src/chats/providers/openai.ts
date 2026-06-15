import {tools as ollamaTools} from '../tools/ollama_tools'
import {Usage, StreamChunk, ChatMessage} from '../types'
import {ToolsFunction} from '../tools/functions/types'
import {aiSettings} from '../settings'
import OpenAI from 'openai'

// ─────────────────────────────────────────────
// OpenAI
// Models: gpt-4o | gpt-4.1 | gpt-5.4 | o3 | o4-mini
// For coding agent tasks: gpt-5.3-codex | gpt-5.2-codex
// ─────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OpenAIResponse {
	model?: string
	output_text?: string
	output?: Array<{
		type: string
		name?: string
		arguments?: string
		call_id?: string
		content?: Array<{type: string; text?: string}>
	}>
	usage?: {
		input_tokens?: number
		output_tokens?: number
		total_tokens?: number
		prompt_tokens?: number
		completion_tokens?: number
	}
}

export default async function* (
	model: string,
	messages: ChatMessage[],
	signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
	const config: any = {
		apiKey: aiSettings.apiKeys.openai,
		dangerouslyAllowBrowser: true,
	}

	if (String(aiSettings.openaiHost).length > 0)
		config['baseURL'] = aiSettings.openaiHost

	const client = new OpenAI(config)

	const input: any[] = messages
		.filter(m => m.role !== 'tool')
		.map(m => ({role: m.role, content: m.content}))

	const openaiTools = ollamaTools.map(tool => ({
		type: 'function' as const,
		name: tool.function.name,
		description: tool.function.description,
		parameters: tool.function.parameters,
		strict: false,
	}))

	let fullText = ''
	let usage: Usage = {inputTokens: 0, outputTokens: 0, totalTokens: 0}
	let resolvedModel = model

	while (true) {
		if (signal?.aborted) break

		const response: OpenAIResponse = (await client.responses.create(
			{
				model,
				instructions: aiSettings.systemInstruction,
				temperature: aiSettings.temperature,
				max_output_tokens: aiSettings.maxTokens,
				parallel_tool_calls: true,
				tool_choice: 'auto',
				tools: openaiTools,
				input,
			},
			{signal},
		)) as any

		resolvedModel = response?.model ?? resolvedModel

		if (response?.usage) {
			usage = {
				inputTokens:
					response.usage.input_tokens ?? response.usage.prompt_tokens ?? 0,
				outputTokens:
					response.usage.output_tokens ?? response.usage.completion_tokens ?? 0,
				totalTokens: response.usage.total_tokens ?? 0,
			}
		}

		const turnText = getResponseText(response)

		if (turnText) {
			fullText += turnText
			yield {type: 'text', model: resolvedModel, delta: turnText}
		}

		const toolCalls = Array.isArray(response?.output)
			? response.output.filter(
					item => item?.type === 'function_call' && item?.name,
				)
			: []

		if (!toolCalls.length) break

		input.push(...(response.output ?? []))

		for (const call of toolCalls) {
			const toolName = call?.name
			if (!toolName) continue

			try {
				const toolFunction: ToolsFunction = (
					await import(`../tools/functions/${toolName}`)
				).default

				const rawArgs = call?.arguments ?? '{}'
				const args = safeJsonParse(rawArgs)
				const chunkedResult = toolFunction(args as any)
				let resultContent = ''

				for await (const toolChunk of chunkedResult) {
					if (toolChunk.toSave) {
						yield {
							type: 'tool',
							delta: toolChunk.toSave,
							model: resolvedModel,
						}
					}

					if (toolChunk.result) {
						resultContent = toolChunk.result
						break
					}
				}

				input.push({
					type: 'function_call_output',
					call_id: call.call_id,
					output: resultContent || '[NO RESULT]',
				})
			} catch (e: unknown) {
				const errorMessage =
					e instanceof Error ? e.message : String(e || 'Unknown error')

				input.push({
					type: 'function_call_output',
					call_id: call.call_id,
					output: `[ERROR] ${errorMessage}`,
				})
			}
		}
	}

	yield {
		type: 'done',
		text: fullText,
		provider: 'openai',
		model: resolvedModel,
		usage,
	}
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function safeJsonParse(raw: string): Record<string, unknown> {
	try {
		return JSON.parse(raw) as Record<string, unknown>
	} catch {
		return {}
	}
}

function getResponseText(response: OpenAIResponse): string {
	if (response?.output_text) return response.output_text
	if (!Array.isArray(response?.output)) return ''

	let text = ''

	for (const item of response.output) {
		if (item?.type !== 'message' || !Array.isArray(item?.content)) continue

		for (const contentPart of item.content) {
			if (contentPart?.type === 'output_text' && contentPart?.text) {
				text += contentPart.text
			}
		}
	}

	return text
}
