export class ZylemDebug extends HTMLElement {
	constructor() {
		super();
		this.style.position = "fixed";
		this.style.top = "0";
		this.style.left = "0";
		this.style.background = "rgba(255, 255, 255, 0.7)";
		this.style.padding = "10px";
		this.style.fontFamily = "monospace";
		this.style.fontSize = "12px";
		window.addEventListener("resize", () => {
			this.style.width = window.innerWidth + "px";
			this.style.height = window.innerHeight + "px";
		});
	}
	connectedCallback() {
		const debugText = document.createElement("div");
		debugText.textContent = "This is a debug overlay!";
		this.appendChild(debugText);

		this.style.width = window.innerWidth + "px";
		this.style.height = window.innerHeight + "px";
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