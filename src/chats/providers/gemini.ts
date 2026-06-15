import {Usage, StreamChunk, ChatMessage, ToolCall} from '../types'
import {tools as ollamaTools} from '../tools/ollama_tools'
import {ToolsFunction} from '../tools/functions/types'
import {GoogleGenAI} from '@google/genai'
import {aiSettings} from '../settings'

// ─────────────────────────────────────────────
// Gemini
// ─────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

interface GeminiStreamChunk {
	text?: string
	modelVersion?: string
	candidates?: Array<{
		content?: {
			role?: string
			parts?: Array<{text?: string; functionCall?: Record<string, unknown>}>
		}
	}>
	functionCalls?: Array<{
		id?: string
		name: string
		args?: Record<string, unknown>
	}>
	usageMetadata?: {
		promptTokenCount?: number
		candidatesTokenCount?: number
		totalTokenCount?: number
	}
}

export default async function* (
	model: string,
	messages: ChatMessage[],
	signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
	const ai = new GoogleGenAI({apiKey: aiSettings.apiKeys.gemini})

	const turnMessages: ChatMessage[] = messages.map(m => ({
		role: m.role,
		content: m.content,
	}))

	const contents: any[] = turnMessages
		.filter(m => m.role === 'user' || m.role === 'assistant')
		.map(m => {
			if (m.role === 'assistant') {
				return {role: 'model', parts: [{text: m.content || ''}]}
			}

			return {role: 'user', parts: [{text: m.content}]}
		})

	const functionDeclarations = ollamaTools.map(tool => ({
		name: tool.function.name,
		description: tool.function.description,
		parameters: tool.function.parameters,
	}))

	const config: any = {
		systemInstruction: aiSettings.systemInstruction,
		temperature: aiSettings.temperature,
		maxOutputTokens: aiSettings.maxTokens,
		tools: [{functionDeclarations}],
	}

	let fullText = ''
	let chunk: GeminiStreamChunk | null = null
	let usage: Usage = {inputTokens: 0, outputTokens: 0, totalTokens: 0}

	while (true) {
		if (signal?.aborted) break

		const stream = await ai.models.generateContentStream({
			model,
			contents,
			config,
		})

		const toolCalls: ToolCall[] = []
		const seenToolCallIds = new Set<string>()
		let turnText = ''
		let lastModelContent: any = null

		for await (const rawChunk of stream) {
			if (signal?.aborted) break

			chunk = rawChunk as unknown as GeminiStreamChunk

			const candidateContent = chunk?.candidates?.[0]?.content
			if (candidateContent?.parts?.length) {
				lastModelContent = chunk.candidates?.[0] ?? null
			}

			const functionCalls = chunk.functionCalls
			if (functionCalls?.length) {
				for (const call of functionCalls) {
					const id =
						call?.id ?? `${call?.name}:${JSON.stringify(call?.args ?? {})}`
					if (seenToolCallIds.has(id)) continue
					seenToolCallIds.add(id)
					toolCalls.push({
						id: call.id,
						function: {
							name: call.name,
							arguments: JSON.stringify(call.args ?? {}),
						},
					})
				}
			}

			const delta = chunk.text ?? ''
			if (delta) {
				turnText += delta
				fullText += delta
				yield {type: 'text', delta, model: chunk.modelVersion || model}
			}

			const meta = chunk.usageMetadata

			if (meta) {
				usage = {
					inputTokens: meta.promptTokenCount ?? 0,
					outputTokens: meta.candidatesTokenCount ?? 0,
					totalTokens: meta.totalTokenCount ?? 0,
				}
			}
		}

		if (!toolCalls.length) break

		turnMessages.push({
			role: 'assistant',
			content: turnText,
			tool_calls: toolCalls,
		})

		if (lastModelContent?.parts?.length) {
			contents.push(lastModelContent)
		} else {
			const fallbackParts: any[] = []
			if (turnText) fallbackParts.push({text: turnText})
			for (const call of toolCalls) {
				fallbackParts.push({
					functionCall: {
						id: call.id,
						name: call.function.name,
						args: JSON.parse(call.function.arguments),
					},
				})
			}

			contents.push({
				role: 'model',
				parts: fallbackParts.length ? fallbackParts : [{text: ''}],
			})
		}

		const functionResponses: any[] = []

		for (const call of toolCalls) {
			const toolName = call.function.name
			if (!toolName) continue

			try {
				const toolFunction: ToolsFunction = (
					await import(`../tools/functions/${toolName}`)
				).default

				const args = JSON.parse(call.function.arguments) as Record<
					string,
					unknown
				>
				const chunkedResult = toolFunction(args)

				let resultContent = ''

				for await (const toolChunk of chunkedResult) {
					if (toolChunk.toSave) {
						yield {
							type: 'tool',
							delta: toolChunk.toSave,
							model: chunk?.modelVersion || model,
						}
					}

					if (toolChunk.result) {
						resultContent = toolChunk.result
						break
					}
				}

				functionResponses.push({
					functionResponse: {
						id: call.id,
						name: toolName,
						response: {result: resultContent || '[NO RESULT]'},
					},
				})

				turnMessages.push({
					role: 'tool',
					tool_name: toolName,
					content: resultContent || '[NO RESULT]',
				})
			} catch (e: unknown) {
				const errorMessage =
					e instanceof Error ? e.message : String(e || 'Unknown error')

				functionResponses.push({
					functionResponse: {
						id: call.id,
						name: toolName,
						response: {result: `[ERROR] ${errorMessage}`},
					},
				})

				turnMessages.push({
					role: 'tool',
					tool_name: toolName,
					content: `[ERROR] ${errorMessage}`,
				})
			}
		}

		contents.push({
			role: 'user',
			parts: functionResponses.map(fr => ({
				functionResponse: fr.functionResponse,
			})),
		})
	}

	yield {
		type: 'done',
		text: fullText,
		provider: 'gemini',
		model: chunk?.modelVersion || model,
		usage,
	}
}

/* eslint-enable @typescript-eslint/no-explicit-any */
