import {
	debugState,
	setDebugTool,
	setGridVisible,
	setSnapSettings,
	DEFAULT_SNAP_SETTINGS,
} from '@zylem/game-lib/debug';

export function enableEditorDebugMode() {
	debugState.enabled = true;
	setDebugTool('translate');
	setGridVisible(true);
	setSnapSettings({ ...DEFAULT_SNAP_SETTINGS, enabled: true, translate: 0.5 });
}
