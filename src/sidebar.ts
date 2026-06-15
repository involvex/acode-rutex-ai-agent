import {PLUGIN_ID} from './configs/constants'
import {renderPanel} from './panel'
import Icon from './icons/icon.svg'

const sideBarApps = acode.require('sidebarApps')
let scrollBottom: undefined | (() => void) = undefined

const removeIcon = () => {
	sideBarApps.remove(PLUGIN_ID)
}

const addIcon = () => {
	acode.addIcon('ai-agent-icon', Icon)

	// Remove first in case plugin is reloading/updating
	removeIcon()

	sideBarApps.add(
		'ai-agent-icon',
		PLUGIN_ID,
		'Rutex AI Agent',
		(container: HTMLElement) => {
			scrollBottom = renderPanel(container)
		},
		false,
		() => {
			// Optional: logic to run whenever the sidebar is toggled open
			if (scrollBottom) scrollBottom()
		},
	)
}

export {addIcon, removeIcon}
