import {ReadFileInfo, ToolsReturnType} from './types'
import {getRelativePath} from './utils'

export default async function* ({
	uri,
	start_line,
	end_line,
}: ReadFileInfo): AsyncGenerator<ToolsReturnType> {
	const startLine = Math.max(1, start_line)
	const endLine = Math.max(2, end_line)

	// --- SEND SIGNAL TO PANEL THAT FILE IS BEING READ ---
	const relativePath = getRelativePath(uri)

	const toolCalling = JSON.stringify({
		header: `READ: ${relativePath}:${startLine}-${endLine}`,
	})
	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	// --- START FILE READ ---
	const fs = acode.require('fs')

	const exists = await fs(uri)?.exists()

	if (!exists) {
		throw new Error('File does not exist.')
	}

	const content = await fs(uri).readFile('utf-8')

	const lines = content.split('\n')

	const result = lines
		.slice(startLine - 1, endLine)
		.map((line, index) => `${startLine + index}: ${line}`)
		.join('\n')

	yield {result, toSave}
}
