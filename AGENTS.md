# AGENTS.md — Rutex AI Coding Agent

This document provides comprehensive instructions for AI agents working on the **Rutex** codebase — an autonomous AI agent plugin for the **Acode** mobile editor on Android.

---

## Project Overview

Rutex transforms Acode into an agentic IDE where LLMs can read, create, edit, and refactor files in real-time. It supports multiple AI providers (Gemini, OpenRouter, Ollama, OpenAI, Claude, DeepSeek, Qwen) and uses an intelligent diff engine with line-based editing.

- **License**: MIT
- **Author**: Dave Conco (dconco) / Hall Of Codes team
- **Plugin ID**: `hallofcodes.rutex.coding_agent`
- **Entry point**: `dist/main.js` (Webpack bundle of `src/main.ts`)

---

## Useful Commands

All commands use **Bun** as the package manager and task runner.

```bash
# Build & Development
bun run build              # Full build (format + lint + typecheck + webpack)
bun run build-release      # Production build (webpack --mode production)

# Code Quality
bun run format             # Run Prettier on the entire project
bun run lint               # Run ESLint on src/
bun run lint:fix           # Run ESLint with auto-fix on src/
bun run typecheck          # TypeScript type checking (tsc --noEmit)

# Combined
bun run prebuild           # Runs format + lint:fix + typecheck (auto-runs before build)
```

**Important**: Always run `bun run build` before committing to verify the full pipeline passes. The `prebuild` script runs automatically before `build` and executes format, lint, and typecheck in sequence.

---

## Technologies

| Category            | Technology                                                                           | Details                                                               |
| ------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| **Language**        | TypeScript                                                                           | Strict mode, ES2022 target, CommonJS modules                          |
| **Package Manager** | Bun                                                                                  | Preferred for all package management and script execution             |
| **Bundler**         | Webpack                                                                              | Entry: `src/main.ts`, Output: `dist/[name].js`                        |
| **Linter**          | ESLint                                                                               | Flat config (`eslint.config.mts`), typescript-eslint recommended      |
| **Formatter**       | Prettier                                                                             | Configured via `.prettierignore` (excludes AI agent dirs, build dirs) |
| **Runtime Target**  | Acode Plugin API                                                                     | Android mobile editor, browser-like environment                       |
| **AI SDKs**         | `@anthropic-ai/sdk`, `@google/genai`, `openai`, `@openrouter/sdk`                    | Provider integrations                                                 |
| **Utilities**       | `zod` (validation), `highlight.js` (code highlighting), `path-browserify` (path ops) |                                                                       |
| **Storage**         | localStorage (settings), IndexedDB (chat/edit history)                               | No server-side storage                                                |

---

## Project Architecture

```
src/
  main.ts                    — Plugin entry point (Acode plugin init/destroy lifecycle)
  sidebar.ts                 — Sidebar icon and panel registration
  panel.ts                   — Main chat panel UI (DOM events, streaming, input handling)
  panel.html                 — Self-contained HTML/CSS for the chat UI (inline styles)
  configs/
    constants.ts             — Plugin ID, storage keys, DB constants
  helpers/
    pluginSettings.ts        — Acode settings API wrapper
    workspace.ts             — Workspace folder detection, active file listing
  exceptions/
    UnknownProviderError.ts  — Custom error class
  panel/
    types.ts                 — ChatMessage, ContextFile, AIPanelAPI interfaces
    utils.ts                 — DOM utilities, escapeHtml, copyText, decodeBase64
    markdown.ts              — Markdown rendering with highlight.js code blocks
    commandParser.ts         — Parses tool call tags to HTML
    settingsContainer.ts     — Settings dialog and model selection menus
    historyContainer.ts      — Chat history dialog
    renderEditedFilesDialog.ts — Edited files bar (accept/reject)
  chats/
    types.ts                 — ChatMessage, Provider, Usage, StreamChunk types
    settings.ts              — AISettings interface and localStorage persistence
    handleAgents.ts          — Main sendChat() async generator (orchestrator)
    providers/
      claude.ts              — Anthropic Claude (streaming)
      gemini.ts              — Google Gemini (streaming + tool calls)
      openai.ts              — OpenAI responses API (tool calls)
      deepseek.ts            — DeepSeek (OpenAI-compatible)
      ollama.ts              — Ollama local (streaming + tool calls)
      openrouter.ts          — OpenRouter (official SDK + tool calls)
      qwen.ts                — Qwen (fetch-based SSE streaming)
    models/
      types.ts               — ProviderModelMeta interface
      *_models.ts            — Model definitions per provider
    history/
      chatHistory.ts         — IndexedDB-based chat & edited file history
    tools/
      ollama_tools.ts        — Tool definitions (OpenAI function format, 9 tools)
      functions/
        types.ts             — Tool argument/result types
        utils.ts             — getRelativePath helper
        read_file.ts         — Read file content (line-range)
        edit_file.ts         — Line-based file editing with diff tracking
        create_file.ts       — Create new file
        create_dir.ts        — Create new directory
        delete_path.ts       — Delete file/directory
        move_path.ts         — Move file/directory
        rename_path.ts       — Rename file/directory
        list_dir.ts          — List directory contents
        view_edited_files_history.ts — Retrieve edit history
```

---

## Best Practices and Guidelines

### 1. Code Style & Conventions

- **TypeScript strict mode** is enabled. All code must compile without errors under `tsc --noEmit`.
- **Tabs for indentation** (not spaces) — match the existing codebase style.
- **Semicolons** are used consistently — include them.
- **Single quotes** for strings where Prettier defaults apply.
- Run `bun run format` before committing to ensure consistent formatting.
- Run `bun run lint:fix` to auto-fix linting issues.
- Never commit code that fails `bun run typecheck`.

### 2. Provider Pattern

Every AI provider follows the same async generator pattern:

```typescript
// Each provider is an async generator yielding StreamChunk objects
async function* myProvider(settings, messages, tools): AsyncGenerator<StreamChunk> {
  // Stream text chunks
  yield { type: "text", content: "..." }

  // Signal tool calls
  yield { type: "tool", name: "tool_name", arguments: {...} }

  // Signal completion
  yield { type: "done", usage: {...} }
}
```

When adding a new provider:

- Create a new file in `src/chats/providers/`.
- Implement the async generator function matching the existing signature.
- Add model definitions in `src/chats/models/`.
- Register the provider in `handleAgents.ts`.
- Ensure streaming works correctly (yield text chunks as they arrive).

### 3. Tool Development

Tools are defined in `src/chats/tools/functions/` as async generators:

```typescript
// Tool function signature
export async function* toolName(args: ToolArgs): AsyncGenerator<ToolResult> {
	// Implement tool logic
	yield {content: 'result'}
}
```

When adding a new tool:

- Create the function in `src/chats/tools/functions/`.
- Define the tool schema in `ollama_tools.ts` (OpenAI function calling format).
- Add argument/result types in `src/chats/tools/functions/types.ts`.
- Register the tool in the tool execution switch in `handleAgents.ts`.
- Follow existing naming conventions: `snake_case` for filenames and tool names.

### 4. UI Development

- The chat panel UI lives in `panel.html` (inline CSS) and `panel.ts` (DOM logic).
- All styles are inlined in the HTML file — no external CSS files.
- Use DOM utilities from `panel/utils.ts` (escapeHtml, copyText, etc.).
- Markdown rendering uses `highlight.js` for code syntax highlighting.
- The UI must work in Acode's WebView environment (Android).

### 5. State Management

- **Settings**: Use `localStorage` via the helpers in `helpers/pluginSettings.ts`.
- **Chat history**: Use IndexedDB via `chats/history/chatHistory.ts`.
- **Never store sensitive data** in localStorage — use secure storage when available.
- Settings changes should be persisted immediately (no batching).

### 6. Error Handling

- Use the custom `UnknownProviderError` for provider-related errors.
- Always wrap async operations in try/catch blocks.
- Log errors using the `clg()` global function (declared in `typings/declarations.d.ts`).
- Never let unhandled promise rejections propagate — they crash the plugin.

### 7. File Editing

- The diff engine uses line-based editing (`edit_file.ts`).
- Always validate file paths before operations (prevent path traversal).
- Track all edits in the history system for undo/accept/reject functionality.
- Use relative paths when displaying to users, absolute paths for operations.

### 8. Module System

- Webpack bundles everything into a single `dist/main.js`.
- Node.js built-in polyfills are configured in `webpack.config.js`:
  - `fs: false` (no filesystem access in browser)
  - `path: path-browserify`
  - `os: false`, `crypto: false`
- Do not use Node.js APIs (`fs`, `child_process`, `os`, `crypto`) directly — they are polyfilled or unavailable.

### 9. Build & Distribution

- The build produces `dist/main.js` which is the plugin entry point.
- A post-build hook runs `pack-zip.js` to create `dist.zip` for Acode plugin distribution.
- Do not manually edit `dist/` — it is generated by Webpack.
- The `dist.zip` is listed in `.gitignore` — do not commit it.

### 10. Security

- Never hardcode API keys or secrets in source code.
- Use environment variables or Acode's settings system for credentials.
- Validate all user input before passing it to file operations.
- Be cautious with `delete_path` and `move_path` tools — they are destructive.
- The `commandParser.ts` parses tool call tags — sanitize any HTML output.

### 11. Testing

- No formal test framework is configured yet.
- Manual testing is done via `example.html` (development preview).
- Always verify changes by running `bun run build` and testing in Acode.

### 12. Git & Versioning

- Commit messages should be clear and descriptive.
- Use conventional commit format when possible: `feat:`, `fix:`, `chore:`, `docs:`.
- Never commit `dist/`, `dist.zip`, `node_modules/`, or lock files.
- Update `CHANGELOG.md` for user-facing changes.

---

## File Naming Conventions

| Type              | Convention             | Example                            |
| ----------------- | ---------------------- | ---------------------------------- |
| TypeScript source | `camelCase.ts`         | `handleAgents.ts`                  |
| Type definitions  | `types.ts`             | `chats/types.ts`, `panel/types.ts` |
| HTML templates    | `camelCase.html`       | `panel.html`                       |
| Model definitions | `snake_case_models.ts` | `claude_models.ts`                 |
| Tool functions    | `snake_case.ts`        | `read_file.ts`                     |
| Config/constants  | `camelCase.ts`         | `constants.ts`                     |

---

## Key Files to Know

| File                             | Purpose                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| `src/main.ts`                    | Plugin lifecycle — start here for Acode plugin integration       |
| `src/chats/handleAgents.ts`      | Core orchestrator — routes messages to providers, executes tools |
| `src/chats/providers/*.ts`       | AI provider implementations (one per provider)                   |
| `src/chats/tools/functions/*.ts` | Tool implementations (read, edit, create, delete, etc.)          |
| `src/panel.ts`                   | UI event handling and rendering                                  |
| `src/panel.html`                 | Complete chat panel UI with inline CSS                           |
| `webpack.config.js`              | Build configuration and bundling                                 |
| `tsconfig.json`                  | TypeScript compiler options                                      |

---

## Common Pitfalls

1. **Do not use Node.js APIs directly** — `fs`, `child_process`, `os`, and `crypto` are polyfilled or unavailable in the browser environment.
2. **Do not skip the `prebuild` step** — always run `bun run build` (which triggers format + lint + typecheck).
3. **Do not modify `dist/` manually** — it is a generated build artifact.
4. **Do not hardcode API keys** — use Acode's settings system.
5. **Do not use spaces for indentation** — the project uses tabs.
6. **Always escape HTML** — use `escapeHtml()` from `panel/utils.ts` when rendering user content.
7. **Do not ignore TypeScript errors** — the build will fail, and runtime behavior is unpredictable.
8. **IndexedDB operations are async** — always `await` them and handle errors.
