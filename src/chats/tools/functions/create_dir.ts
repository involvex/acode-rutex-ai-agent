import {getRelativePath} from './utils'
import {CreateDirInfo} from './types'

export default async function* ({uri}: CreateDirInfo) {
	// --- SEND SIGNAL TO PANEL THAT FILE IS BEING READ ---
	const relativePath = getRelativePath(uri)

	const toolCalling = JSON.stringify({
		header: `FOLDER CREATED: ${relativePath}`,
	})
	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	// --- START FILE READ ---
	const fs = acode.require('fs')

	const exists = await fs(uri)?.exists()

	if (exists) {
		throw new Error('Specified path already exists.')
	}

	const parentDir = uri.substring(0, uri.lastIndexOf('/'))
	const dirName = uri.substring(uri.lastIndexOf('/') + 1)

	const dirExists = await fs(parentDir).exists()

	if (!dirExists) throw new Error('Parent directory path does not exist.')

	const result = await fs(parentDir).createDirectory(dirName)

	yield {result, toSave}
}
