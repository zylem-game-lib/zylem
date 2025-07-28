export type DebugConfiguration = {
    showCollisionBounds?: boolean;
    showModelBounds?: boolean;
    showSpriteBounds?: boolean;
};
declare const debugState: {
    on: boolean;
    configuration: {
        showCollisionBounds: boolean;
        showModelBounds: boolean;
        showSpriteBounds: boolean;
    };
};
declare const setDebugFlag: (flag?: boolean) => void;
export { debugState, setDebugFlag };
