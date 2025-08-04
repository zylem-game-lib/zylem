export type DebugConfiguration = {
    showCollisionBounds?: boolean;
    showModelBounds?: boolean;
    showSpriteBounds?: boolean;
};
export declare const DebugTools: {
    readonly NONE: "NONE";
    readonly SELECT: "SELECT";
    readonly ADD: "ADD";
    readonly DELETE: "DELETE";
};
declare const debugState: {
    on: boolean;
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
declare const resetSelectedEntities: () => void;
declare const setDebugTool: (tool: keyof typeof DebugTools) => void;
declare const getDebugTool: () => "NONE" | "SELECT" | "ADD" | "DELETE";
declare const setHoveredEntity: (uuid: string) => void;
declare const resetHoveredEntity: () => void;
declare const getHoveredEntity: () => string | null;
export { debugState, setDebugFlag, setSelectedEntity, resetSelectedEntities, setDebugTool, getDebugTool, setHoveredEntity, resetHoveredEntity, getHoveredEntity };
