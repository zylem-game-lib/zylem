import { DebugTools } from './debug-state';
export declare const debugStore: {
    debug: boolean;
    tool: keyof typeof DebugTools;
    paused: boolean;
}, setDebugStore: import("solid-js/store").SetStoreFunction<{
    debug: boolean;
    tool: keyof typeof DebugTools;
    paused: boolean;
}>;
