import type { Component } from 'solid-js';
import {
	Editor,
	type EditorController,
	type EditorLauncherMode,
} from './components/Editor';

export interface AppProps {
	launcherMode?: EditorLauncherMode | undefined;
	onControllerReady?: ((controller: EditorController | null) => void) | undefined;
}

const App: Component<AppProps> = (props) => {
	return (
		<Editor
			launcherMode={props.launcherMode}
			onControllerReady={props.onControllerReady}
		/>
	);
};

export default App;
export type { EditorController, EditorLauncherMode } from './components/Editor';
