// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ToolCall {
	id?: string
	function: {
		name: string
		arguments: string
	}
}

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system' | 'tool'
	content: string
	tool_calls?: ToolCall[]
	tool_name?: string
}

export type Provider =
	| 'claude'
	| 'openai'
	| 'gemini'
	| 'deepseek'
	| 'ollama'
	| 'openrouter'
	| 'qwen'
	| 'opencode'
	| 'kilo'

export interface Usage {
	inputTokens: number
	outputTokens: number
	totalTokens: number
}

/**
 * Each yield from sendChat() is one of these two shapes.
 *
 * - { type: "text" }  — a chunk of the response text, append to your UI
 * - { type: "done" }  — stream finished, contains full text + usage stats
 */
export type StreamChunk =
	| {type: 'text' | 'tool'; delta: string; model?: string}
	| {
			type: 'done'
			text: string
			provider: Provider
			model: string
			usage: Usage
	  }

export type StreamFunction = (
	model: string,
	messages: ChatMessage[],
	signal?: AbortSignal,
) => AsyncGenerator<StreamChunk>

export type CurrentEditedFiles = Record<
	string,
	{
		type: 'edited' | 'created'
		totalAdded: number
		totalRemoved: number
		editedHistoryIds: string[]
	}
>
