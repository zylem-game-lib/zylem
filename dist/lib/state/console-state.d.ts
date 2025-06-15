/**
 * Console state for managing debug console messages
 */
export declare const consoleState$: import("@simplyianm/legend-state").ObservableObject<{
    messages: string[];
}>;
/**
 * Append a message to the debug console
 * @param message The message to append to the console
 */
export declare const printToConsole: (message: string) => void;
/**
 * Clear all messages from the debug console
 */
export declare const clearConsole: () => void;
/**
 * Get all console messages as a single string
 */
export declare const getConsoleContent: () => string;
