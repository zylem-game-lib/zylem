import { proxy } from 'valtio/vanilla';

/**
 * Console state for managing debug console messages
 */
export const consoleState = proxy({
	messages: [] as string[],
});

/**
 * Maximum retained console lines. The console is a ring buffer because a
 * chatty game can print continuously, and an unbounded array would grow the
 * proxy (and the string rebuilt for display) without limit.
 */
export const MAX_CONSOLE_MESSAGES = 500;

/**
 * Append a message to the debug console
 * @param message The message to append to the console
 */
export const printToConsole = (message: string) => {
	const timestamp = new Date().toLocaleTimeString();
	const formattedMessage = `[${timestamp}] ${message}`;
	consoleState.messages.push(formattedMessage);
	if (consoleState.messages.length > MAX_CONSOLE_MESSAGES) {
		consoleState.messages.splice(
			0,
			consoleState.messages.length - MAX_CONSOLE_MESSAGES,
		);
	}
};

/**
 * Clear all messages from the debug console
 */
export const clearConsole = () => {
	consoleState.messages = [];
};

/**
 * Get all console messages as a single string
 */
export const getConsoleContent = () => {
	return consoleState.messages.join('\n');
}; 