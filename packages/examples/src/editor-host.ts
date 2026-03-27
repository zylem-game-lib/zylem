export interface ZylemEditorHostElement extends HTMLElement {
	openPanel: () => void;
	closePanel: () => void;
	togglePanel: () => void;
}

export const getZylemEditorElement = () => {
	if (typeof document === 'undefined') {
		return null;
	}

	return document.querySelector('zylem-editor') as ZylemEditorHostElement | null;
};
