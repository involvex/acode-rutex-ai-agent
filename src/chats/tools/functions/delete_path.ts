import {getRelativePath} from './utils'
import {CreateFileInfo} from './types'

export default async function* ({uri}: CreateFileInfo) {
	// --- START FILE READ ---
	const fs = acode.require('fs')

	const exists = await fs(uri)?.exists()

	if (!exists) {
		throw new Error('Specified path does not exists.')
	}

	const fileInfo = await fs(uri).stat()

	// --- SEND SIGNAL TO PANEL THAT FILE IS BEING READ ---
	const relativePath = getRelativePath(uri)

	const result = `${
		fileInfo.isFile ? 'FILE' : 'DIRECTORY'
	} DELETED: ${relativePath}`

	const toolCalling = JSON.stringify({
		header: result,
	})
	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	await fs(uri).delete()

	yield {result, toSave}
}
