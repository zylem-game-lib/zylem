export declare const DebugTools: {
    readonly NONE: "NONE";
    readonly SELECT: "SELECT";
    readonly ADD: "ADD";
    readonly DELETE: "DELETE";
};
declare const debugState: {
    on: boolean;
    paused: boolean;
    configuration: {
        showCollisionBounds: boolean;
        showModelBounds: boolean;
        showSpriteBounds: boolean;
    };
    hovered: string | null;
    selected: string[];
    tool: keyof typeof DebugTools;
};
declare const setDebugFlag: (flag?: boolean) => void;
declare const setSelectedEntity: (uuid: string) => void;
/**
 * Set the active debug tool and print the selection to the debug console.
 * @param tool The tool to activate
 */
declare const setDebugTool: (tool: keyof typeof DebugTools) => void;
declare const getDebugTool: () => "NONE" | "SELECT" | "ADD" | "DELETE";
declare const setHoveredEntity: (uuid: string) => void;
declare const resetHoveredEntity: () => void;
declare const getHoveredEntity: () => string | null;
export { debugState, setDebugFlag, setSelectedEntity, setDebugTool, getDebugTool, setHoveredEntity, resetHoveredEntity, getHoveredEntity };
export declare const togglePause: () => void;
/**
 * Set pause state directly and print the new state to the console.
 * @param paused Whether to pause (true) or resume (false)
 */
export declare const setPaused: (paused: boolean) => void;
export declare const isPaused: () => boolean;
//# sourceMappingURL=debug-state.d.ts.map