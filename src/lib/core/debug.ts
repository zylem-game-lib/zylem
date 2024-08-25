import * as dat from 'dat.gui';
import Stats from 'stats.js';
import { ZylemBlue, ZylemBlueTransparent, ZylemGoldText } from '../interfaces/utility';

//TODO: Debug configuration
export type DebugConfiguration = {
	showCollisionBounds?: boolean;
	showModelBounds?: boolean;
	showSpriteBounds?: boolean;
	//TODO: show movement vector? other world related possibilities
}

export class ZylemDebug extends HTMLElement {
	statsRef: Stats;
	debugStyle: Partial<CSSStyleDeclaration> = {
		display: 'grid',
		position: 'fixed',
		top: '0',
		left: '0',
		width: '39vw',
		height: '39vh',
		background: ZylemBlueTransparent,
		padding: '10px',
		color: ZylemGoldText,
		fontFamily: 'monospace',
		fontSize: '12px',
		border: `2px solid ${ZylemBlue}`,
		borderBottomRightRadius: '10px',
		borderTop: '0px',
		borderLeft: '0px',
		zIndex: '1000',
	};

	constructor() {
		super();
		this.addDataGUI();
		this.statsRef = this.addStats();
		this.setStyles();
	}

	setStyles() {
		for (const prop in this.debugStyle) {
			const value = this.debugStyle[prop] ?? '';
			this.style[prop] = value;
		}
	}

	addStats() {
		const stats = new Stats();
		stats.showPanel(0);
		this.appendChild(stats.dom);
		stats.dom.style.position = 'relative';
		return stats;
	}

	addDataGUI() {
		const gui = new dat.GUI({
			name: 'Debug menu',
			closeOnTop: true,
		});
		this.appendChild(gui.domElement);
	}

	connectedCallback() {
		const debugText = document.createElement("div");
		debugText.textContent = "Debug overlay connected!";
		this.appendChild(debugText);
	}

	addInfo(info: string) {
		const infoText = document.createElement("p");
		infoText.textContent = info;
		this.appendChild(infoText);
		if (this.children.length > 5) {
			this.removeChild(this.children[0]);
		}
	}

	appendToDOM() {
		document.body.appendChild(this);
	}
}

customElements.define("zylem-debug", ZylemDebug);