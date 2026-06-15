import {ProviderModelMeta} from './types'

export default [
	// ─── Qwen3-Coder Series (dedicated coding models) ─────────────────────────
	{
		id: 'qwen3-coder-plus',
		label: 'Qwen3 Coder Plus',
		contextWindow: '1M tokens',
		maxOutputTokens: '16K tokens',
		bestFor: [
			'Agentic coding',
			'Repo-scale tasks',
			'Tool use',
			'Multi-file editing',
		],
		notes:
			'Most capable Qwen coding model (480B MoE). Comparable to Claude Sonnet on SWE-Bench. Use with dashscope-intl base URL.',
	},
	{
		id: 'qwen3-coder-next',
		label: 'Qwen3 Coder Next',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: [
			'Agentic coding',
			'IDE integration',
			'Local deployment',
			'Tool use',
		],
		notes:
			'80B total / 3B active MoE. Matches models 10–20x its active size. Optimized for Qwen Code, Claude Code, Cline, and similar agents.',
	},
	{
		id: 'qwen3-coder-flash',
		label: 'Qwen3 Coder Flash',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: [
			'Fast code generation',
			'Code completion',
			'Lightweight coding tasks',
		],
		notes:
			'Faster, cheaper Coder variant. Good for high-frequency code tasks where speed matters.',
	},

	// ─── Qwen3.6 / Qwen3.5 (general with strong coding) ─────────────────────
	{
		id: 'qwen3.6-plus',
		label: 'Qwen3.6 Plus',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: ['Coding', 'Reasoning', 'Agentic tasks', 'Long context'],
		notes:
			'Latest Qwen release (April 2026). Thinking mode supported via enable_thinking. Strong all-rounder with excellent coding.',
	},
	{
		id: 'qwen3.5-plus',
		label: 'Qwen3.5 Plus',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: ['Coding', 'Reasoning', 'Long context tasks'],
		notes:
			'Supports thinking mode. Multimodal. Strong predecessor to Qwen3.6-Plus.',
	},
	{
		id: 'qwen3.5-flash',
		label: 'Qwen3.5 Flash',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: ['Fast responses', 'Code generation', 'Daily development'],
		notes:
			'Faster, cost-efficient Qwen3.5 variant. Good balance of speed and quality.',
	},

	// ─── Qwen3 (reasoning + coding) ──────────────────────────────────────────
	{
		id: 'qwen3-235b-a22b',
		label: 'Qwen3 235B A22B',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: [
			'Complex reasoning',
			'Hard coding problems',
			'Math',
			'Research tasks',
		],
		notes:
			'Flagship open-source Qwen3 MoE. 235B total / 22B active. Thinking mode available. Best for hard problems.',
	},
	{
		id: 'qwen3-235b-a22b-thinking-2507',
		label: 'Qwen3 235B A22B Thinking',
		contextWindow: '256K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: ['Deep reasoning', 'Complex coding', 'Math/logic', 'Research'],
		notes:
			'Extended thinking variant of Qwen3-235B. Scaled reasoning depth. State-of-the-art among open-source thinking models.',
	},
	{
		id: 'qwen3-32b',
		label: 'Qwen3 32B',
		contextWindow: '128K tokens',
		maxOutputTokens: '8K tokens',
		bestFor: ['Code generation', 'General coding', 'Reasoning', 'Daily tasks'],
		notes:
			'Dense 32B model. Good balance of capability and cost. Supports thinking mode.',
	},
	{
		id: 'qwen3-30b-a3b',
		label: 'Qwen3 30B A3B',
		contextWindow: '128K tokens',
		maxOutputTokens: '8K tokens',
		bestFor: ['Efficient coding', 'Tool use', 'Agentic tasks'],
		notes:
			'30B total / 3B active MoE. Very efficient. Good for agent deployments at lower cost.',
	},
	{
		id: 'qwen3-14b',
		label: 'Qwen3 14B',
		contextWindow: '128K tokens',
		maxOutputTokens: '8K tokens',
		bestFor: ['Code generation', 'Fast responses', 'Everyday coding'],
		notes: 'Solid mid-size dense model. Good for moderate coding tasks.',
	},

	// ─── Qwen3 Max (hosted tier alias) ───────────────────────────────────────
	{
		id: 'qwen3-max',
		label: 'Qwen3 Max',
		contextWindow: '128K tokens',
		maxOutputTokens: '16K tokens',
		bestFor: ['Complex coding', 'Reasoning', 'Agentic workflows'],
		notes:
			"Hosted alias for Alibaba's most capable Qwen3 variant. Auto-updates to latest snapshot.",
	},

	// ─── Qwen2.5-Coder (previous generation, still widely used) ──────────────
	{
		id: 'qwen2.5-coder-32b-instruct',
		label: 'Qwen2.5 Coder 32B',
		contextWindow: '128K tokens',
		maxOutputTokens: '8K tokens',
		bestFor: ['Code generation', 'Code completion', 'Debugging', 'Refactoring'],
		notes:
			'Previous-gen coding flagship. Still excellent for most coding tasks. Supports FIM (fill-in-middle) completion.',
	},
	{
		id: 'qwen2.5-coder-7b-instruct',
		label: 'Qwen2.5 Coder 7B',
		contextWindow: '128K tokens',
		maxOutputTokens: '8K tokens',
		bestFor: ['Fast code completion', 'Lightweight tasks', 'Local deployment'],
		notes:
			'Small, fast coding model. Great for quick completions and low-latency use cases.',
	},
] as const satisfies ProviderModelMeta[]
