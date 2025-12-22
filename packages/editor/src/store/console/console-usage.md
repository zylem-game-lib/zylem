# Zylem Debug Console Usage

The Zylem debug console allows you to print messages for debugging purposes instead of using the browser's console.

## Basic Usage

```typescript
import { printToConsole } from '../state/console-state';

// Print a simple message
printToConsole('Hello, debug console!');

// Print variable values
const myVariable = { name: 'John', age: 30 };
printToConsole(`User data: ${JSON.stringify(myVariable, null, 2)}`);

// Print with context
printToConsole(`[Component] MyComponent initialized with props: ${JSON.stringify(props)}`);
```

## Available Functions

- `printToConsole(message: string)` - Append a timestamped message to the console
- `clearConsole()` - Clear all messages from the console
- `getConsoleContent()` - Get all console messages as a single string
- `consoleState` - Direct access to the console state (for advanced usage)

## Features

- **Timestamps**: All messages are automatically timestamped
- **Reactive**: The console updates in real-time as messages are added
- **Persistent**: Messages persist until manually cleared
- **Formatted**: JSON objects are nicely formatted for readability

## Example Panel Integration

See `GlobalStatePanel.tsx` for examples of how to integrate console printing into debug panels.
