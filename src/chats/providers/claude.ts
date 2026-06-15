import {StreamChunk, ChatMessage} from '../types'
import Anthropic from '@anthropic-ai/sdk'
import {aiSettings} from '../settings'

// ─────────────────────────────────────────────
// Claude
// ─────────────────────────────────────────────

export default async function* (
	model: string,
	messages: ChatMessage[],
	signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
	const client = new Anthropic({
		apiKey: aiSettings.apiKeys.claude,
		dangerouslyAllowBrowser: true,
	})

	const stream = await client.messages.stream({
		model,
		max_tokens: aiSettings.maxTokens,
		temperature: aiSettings.temperature,
		system: aiSettings.systemInstruction,
		messages: messages.map(m => ({role: m.role, content: m.content}) as any),
		signal,
	})

	let fullText = ''

	for await (const event of stream) {
		if (signal?.aborted) break

		if (
			event.type === 'content_block_delta' &&
			event.delta.type === 'text_delta'
		) {
			const delta = event.delta.text
			fullText += delta
			yield {type: 'text', delta, model}
		}
	}

	// finalMessage() holds usage — it resolves from the already-consumed stream
	const final = await stream.finalMessage()

	yield {
		type: 'done',
		text: fullText,
		provider: 'claude',
		model: final.model,
		usage: {
			inputTokens: final.usage.input_tokens,
			outputTokens: final.usage.output_tokens,
			totalTokens: final.usage.input_tokens + final.usage.output_tokens,
		},
	}
}
