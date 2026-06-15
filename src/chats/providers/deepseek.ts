import {StreamChunk, ChatMessage} from '../types'
import {aiSettings} from '../settings'
import OpenAI from 'openai'

// ─────────────────────────────────────────────
// DeepSeek  (OpenAI-compatible)
// deepseek-chat      → standard
// deepseek-reasoner  → thinking/CoT mode (reasoning_content in raw)
// ─────────────────────────────────────────────

export default async function* (
	model: string,
	messages: ChatMessage[],
	signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
	const client = new OpenAI({
		apiKey: aiSettings.apiKeys.deepseek,
		baseURL: 'https://api.deepseek.com',
		dangerouslyAllowBrowser: true,
	})

	const stream = await client.chat.completions.create(
		{
			model,
			temperature: aiSettings.temperature,
			max_tokens: aiSettings.maxTokens,
			stream: true,
			messages: [
				{role: 'system', content: aiSettings.systemInstruction},
				...messages.map(m => ({role: m.role, content: m.content}) as any),
			],
		},
		{signal},
	)

	let fullText = ''
	let resolvedModel = model

	for await (const chunk of stream) {
		if (signal?.aborted) break

		resolvedModel = chunk.model ?? resolvedModel

		const delta = chunk.choices[0]?.delta?.content ?? ''
		if (delta) {
			fullText += delta
			yield {type: 'text', delta, model}
		}
	}

	const calculateUsage = () => {
		const CHARS_PER_ESTIMATED_TOKEN = 4

		const estimatedInputTokens = Math.max(
			1,
			Math.ceil(fullText.length / CHARS_PER_ESTIMATED_TOKEN),
		)
		const estimatedOutputTokens = Math.max(
			1,
			Math.ceil(fullText.length / CHARS_PER_ESTIMATED_TOKEN),
		)
		return {
			inputTokens: estimatedInputTokens,
			outputTokens: estimatedOutputTokens,
			totalTokens: estimatedInputTokens + estimatedOutputTokens,
		}
	}

	// DeepSeek does not reliably send usage in stream mode — so we make a rough calculation
	yield {
		type: 'done',
		text: fullText,
		provider: 'deepseek',
		model: resolvedModel,
		usage: calculateUsage(),
	}
}
