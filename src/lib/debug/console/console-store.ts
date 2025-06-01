import { createStore } from 'solid-js/store';
import { consoleState$, getConsoleContent } from '../../state/console-state';

export const [consoleStore, setConsoleStore] = createStore({
	messages: [] as string[],
});

consoleState$.onChange(() => {
	setConsoleStore('messages', getConsoleContent().split('\n'));
});
