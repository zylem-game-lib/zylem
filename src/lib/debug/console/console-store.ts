import { createStore } from 'solid-js/store';
import { subscribe } from 'valtio/vanilla';
import { consoleState, getConsoleContent } from './console-state';

export const [consoleStore, setConsoleStore] = createStore({
	messages: [] as string[],
});

subscribe(consoleState, () => {
	setConsoleStore('messages', getConsoleContent().split('\n'));
});
