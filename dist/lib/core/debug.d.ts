export type DebugConfiguration = {
    showCollisionBounds?: boolean;
    showModelBounds?: boolean;
    showSpriteBounds?: boolean;
};
export declare class ZylemDebug extends HTMLElement {
    constructor();
    connectedCallback(): void;
    addInfo(info: string): void;
    appendToDOM(): void;
}
