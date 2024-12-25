import Stats from 'stats.js';
export type DebugConfiguration = {
    showCollisionBounds?: boolean;
    showModelBounds?: boolean;
    showSpriteBounds?: boolean;
};
export declare class ZylemDebug extends HTMLElement {
	showStats: boolean;
	showConsole: boolean;
	showOverlay: boolean;
	statsRef: Stats;
	consoleTextElement: HTMLDivElement | null;
	debugStyle: Partial<CSSStyleDeclaration>;
	consoleTextElementStyle: Partial<CSSStyleDeclaration>;
	constructor();
	setStyles(dom?: HTMLElement, CSS?: Partial<CSSStyleDeclaration>): void;
	addStats(): Stats;
	addDataGUI(): void;
	connectedCallback(): void;
	addInfo(info: string): void;
	appendToDOM(): void;
}
