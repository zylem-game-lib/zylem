import { proxy } from 'valtio';

/**
 * Console state for managing debug console messages
 */
export const consoleState = proxy({
	messages: [] as string[],
});

/**
 * Append a message to the debug console
 * @param message The message to append to the console
 */
export const printToConsole = (message: string) => {
	const timestamp = new Date().toLocaleTimeString();
	const formattedMessage = `[${timestamp}] ${message}`;
	consoleState.messages.push(formattedMessage);
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