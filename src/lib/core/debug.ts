//TODO: Debug configuration
export type DebugConfiguration = {
	showCollisionBounds?: boolean;
	showModelBounds?: boolean;
	showSpriteBounds?: boolean;
	//TODO: show movement vector? other world related possibilities
}

export class ZylemDebug extends HTMLElement {
	constructor() {
		super();
		this.style.position = "fixed";
		this.style.top = "0";
		this.style.left = "0";
		this.style.background = "rgba(255, 255, 255, 0.6)";
		this.style.padding = "10px";
		this.style.fontFamily = "monospace";
		this.style.fontSize = "12px";
		this.style.zIndex = '1';
		window.addEventListener("resize", () => {
			this.style.width = Math.round(window.innerWidth / 3) + "px";
			this.style.height = Math.round(window.innerHeight / 3) + "px";
		});
	}
	connectedCallback() {
		const debugText = document.createElement("div");
		debugText.textContent = "This is a debug overlay!";
		this.appendChild(debugText);

		this.style.width = Math.round(window.innerWidth / 3) + "px";
		this.style.height = Math.round(window.innerHeight / 3) + "px";
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