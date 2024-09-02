import * as dat from 'dat.gui';
import Stats from 'stats.js';
import { ZylemBlueTransparent, ZylemGoldText } from '../interfaces/utility';

//TODO: Debug configuration
export type DebugConfiguration = {
	showCollisionBounds?: boolean;
	showModelBounds?: boolean;
	showSpriteBounds?: boolean;
	//TODO: show movement vector? other world related possibilities
}

function formatTime() {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export class ZylemDebug extends HTMLElement {
	showStats: boolean = false;
	showConsole: boolean = true;
	showOverlay: boolean = true;

	statsRef: Stats;
	consoleTextElement: HTMLDivElement | null = null;

	debugStyle: Partial<CSSStyleDeclaration> = {
		display: 'grid',
		position: 'fixed',
		top: '0',
		left: '0',
		width: '39vw',
		height: '39vh',
		zIndex: '1000',
	};

	consoleTextElementStyle: Partial<CSSStyleDeclaration> = {
		position: 'absolute',
		width: '100%',
		height: '100%',
		background: ZylemBlueTransparent,
		padding: '10px',
		color: ZylemGoldText,
		fontFamily: 'monospace',
		fontSize: '12px',
		overflowY: 'scroll',
		border: `2px solid ${ZylemGoldText}`,
		borderBottomRightRadius: '10px',
		borderTop: '0px',
		borderLeft: '0px',
	}

	constructor() {
		super();
		this.addDataGUI();
		this.statsRef = this.addStats();
		this.setStyles();
	}

	setStyles(dom: HTMLElement = this, CSS = this.debugStyle) {
		for (const prop in CSS) {
			const value = CSS[prop] ?? '';
			dom.style[prop] = value;
		}
	}

	addStats() {
		const stats = new Stats();
		stats.showPanel(0);
		this.appendChild(stats.dom);
		stats.dom.style.display = this.showStats ? 'block' : 'none';
		stats.dom.style.position = 'relative';
		return stats;
	}

	addDataGUI() {
		const gui = new dat.GUI({
			name: 'Debug menu',
			closeOnTop: true,
		});
		const showOverlay = gui.add({ "Show Overlay": this.showOverlay }, 'Show Overlay');
		showOverlay.onChange((value) => {
			this.style.display = value ? 'grid' : 'none';
		});
		const showStats = gui.add({ "Show Stats": this.showStats }, 'Show Stats');
		showStats.onChange((value) => {
			this.statsRef.dom.style.display = value ? 'block' : 'none';
		});
		const showConsole = gui.add({ "Show Console": this.showConsole }, 'Show Console');
		showConsole.onChange((value) => {
			if (!this.consoleTextElement) return;
			this.consoleTextElement.style.display = value ? 'block' : 'none';
		});
		document.body.appendChild(gui.domElement);
	}

	connectedCallback() {
		const debugText = document.createElement("div");
		debugText.classList.add('zylem-console');
		debugText.textContent = "Debug overlay connected!";
		this.consoleTextElement = debugText;
		this.setStyles(this.consoleTextElement, this.consoleTextElementStyle);
		this.appendChild(debugText);
	}

	addInfo(info: string) {
		const infoText = document.createElement("p");
		infoText.textContent = `[${formatTime()}]: ${info}`;
		const element = this.consoleTextElement!;
		element.appendChild(infoText);
		if (element.children.length > 20 && element.firstChild) {
			element.removeChild(element.firstChild);
		}
		infoText.scrollIntoView({ behavior: "instant", block: "end", inline: "nearest" });
	}

	appendToDOM() {
		document.body.appendChild(this);
	}
}

customElements.define("zylem-debug", ZylemDebug);