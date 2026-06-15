import {ListDirInfo, ToolsReturnType} from './types'
import {getRelativePath} from './utils'

export default async function* ({
	uri,
}: ListDirInfo): AsyncGenerator<ToolsReturnType> {
	// --- SEND SIGNAL TO PANEL THAT DIRECTORY IS LISTING ---
	const relativePath = getRelativePath(uri)

	const toolCalling = JSON.stringify({
		header: `VIEWED: ${relativePath}`,
	})

	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	// --- START FILE READ ---
	const fs = acode.require('fs')
	const entries = await fs(uri)?.lsDir()

	if (!entries) {
		throw new Error('Directory path is invalid or inaccessible.')
	}

	const result =
		entries
			.map((entry: Acode.File) => {
				if (entry.url.startsWith(uri)) {
					return entry.url.slice(uri.length)
				}

				return entry.url
			})
			.join(' | ') || '[EMPTY DIRECTORY]'

	yield {result, toSave}
}
