import {getRelativePath} from './utils'
import {MoveFileInfo} from './types'

export default async function* ({uri, new_uri}: MoveFileInfo) {
	// --- SEND SIGNAL TO PANEL THAT FILE IS BEING READ ---
	const relativePath = getRelativePath(uri)
	const relativeNewPath = getRelativePath(new_uri)

	const toolCalling = JSON.stringify({
		header: `MOVED: ${relativePath} -> ${relativeNewPath}`,
	})
	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	// --- START FILE READ ---
	const fs = acode.require('fs')

	const exists = await fs(uri)?.exists()

	if (!exists) {
		throw new Error('Specified path does not exist.')
	}

	const result = await fs(uri).moveTo(new_uri)

	yield {result, toSave}
}
