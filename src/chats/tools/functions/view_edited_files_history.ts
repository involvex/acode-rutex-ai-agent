import {
	EditedFileHistoryRecord,
	retrieveEditedFileHistory,
} from '../../history/chatHistory'
import {EditedFilesHistoryProps, ToolsReturnType} from './types'

export default async function* ({
	filterByIds = undefined,
	filterByFile = undefined,
	limit = undefined,
}: EditedFilesHistoryProps): AsyncGenerator<ToolsReturnType> {
	// --- SEND SIGNAL TO PANEL THAT FILE EDIT HISTORY IS BEING VIEWED ---

	const toolCalling = JSON.stringify({
		header: `VIEWED FILES EDIT HISTORY`,
	})
	const toSave = `<system_injected_preview>${toolCalling}</system_injected_preview>`

	// --- START FILE EDIT HISTORY ---

	let historyRecords: EditedFileHistoryRecord[] = []

	if (filterByIds)
		historyRecords = await retrieveEditedFileHistory({ids: filterByIds})
	else if (filterByFile)
		historyRecords = await retrieveEditedFileHistory({filePath: filterByFile})

	if (limit && filterByFile) {
		historyRecords = historyRecords.slice(-limit)
	}

	clg(historyRecords)

	yield {result: JSON.stringify(historyRecords), toSave}
}
