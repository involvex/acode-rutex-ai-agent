import {getRelativePath} from './utils'
import {RenameFileInfo} from './types'

export default async function* ({uri, new_name}: RenameFileInfo) {
	// --- SEND SIGNAL TO PANEL THAT FILE IS BEING READ ---
	const relativePath = getRelativePath(uri)

	const toolCalling = JSON.stringify({
		header: `RENAMED: ${relativePath} -> ${new_name}`,
	})
	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	// --- START FILE READ ---
	const fs = acode.require('fs')

	const exists = await fs(uri)?.exists()

	if (!exists) {
		throw new Error('Specified path does not exist.')
	}

	const result = await fs(uri).renameTo(new_name)

	yield {result, toSave}
}
