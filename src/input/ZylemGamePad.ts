import { ControllerInput, GamePadConnections } from "../interfaces/GamePad";

export default class GamePad {
	hasSupport = true;
	lastConnection = -1;
	connections: GamePadConnections = new Map();
	keyboardInput = new Map<string, boolean>();

	constructor() {
		let interval = setInterval(() => {
			if (!this.hasSupport) clearInterval(interval);
			if (this.connections.size > this.lastConnection) this.scanGamePads();
		}, 200);
		window.addEventListener("gamepadconnected", ({ gamepad }) => this.connections.set(gamepad.index, gamepad.connected));
		window.addEventListener("gamepaddisconnected", ({ gamepad }) => this.connections.delete(gamepad.index));
		window.addEventListener("keydown", ({ key }) => this.keyboardInput.set(key, true));
		window.addEventListener("keyup", ({ key }) => this.keyboardInput.set(key, false));
	}

	scanGamePads() {
		const browserGamePadSupport = Boolean(navigator.getGamepads) ?? false;
		if (!browserGamePadSupport) {
			console.warn("This browser doesn't support gamepads");
			this.hasSupport = false;
			return;
		}
		this.lastConnection = navigator.getGamepads().length;
	}

	getInputAtIndex(index: number): ControllerInput {
		const gamepad = navigator.getGamepads()[index];
		const connected = this.connections.get(index) || false;
		const up = this.keyboardInput.get("ArrowUp") || false;
		const down = this.keyboardInput.get("ArrowDown") || false;
		const left = this.keyboardInput.get("ArrowLeft") || false;
		const right = this.keyboardInput.get("ArrowRight") || false;
		const z = this.keyboardInput.get("z") || false;
		const x = this.keyboardInput.get("x") || false;
		const a = this.keyboardInput.get("a") || false;
		const s = this.keyboardInput.get("s") || false;
		const enter = this.keyboardInput.get("Enter") || false;
		const space = this.keyboardInput.get(" ") || false;
		let horizontal = right ? 1 : left ? -1 : 0;
		let vertical = up ? -1 : down ? 1 : 0;
		let buttonA = z ? 1 : 0;
		let buttonB = x ? 1 : 0;
		let buttonX = a ? 1 : 0;
		let buttonY = s ? 1 : 0;
		let buttonSelect = enter ? 1 : 0;
		let buttonStart = space ? 1 : 0;
		if (!connected || !gamepad) {
			return {
				horizontal,
				vertical,
				buttonA,
				buttonB,
				buttonX,
				buttonY,
				buttonSelect,
				buttonStart,
			};
		}
		const [x1, y1] = gamepad.axes;
		horizontal = Math.abs(x1) > 0.1 ? x1 : horizontal;
		vertical = Math.abs(y1) > 0.1 ? y1 : vertical;
		buttonA = gamepad.buttons[0].value || buttonA;
		buttonB = gamepad.buttons[1].value || buttonB;
		buttonX = gamepad.buttons[2].value || buttonX;
		buttonY = gamepad.buttons[3].value || buttonY;
		buttonSelect = gamepad.buttons[8].value || buttonSelect;
		buttonStart = gamepad.buttons[9].value || buttonStart;
		return {
			horizontal,
			vertical,
			buttonA,
			buttonB,
			buttonX,
			buttonY,
			buttonSelect,
			buttonStart,
		};
	}

	getInputs(): ControllerInput[] {
		return [this.getInputAtIndex(0)];
	}

	getDebugInfo(): string {
		const gamepads = navigator.getGamepads();
		let info = "";
		for (let i = 0; i < gamepads.length; i++) {
			const gamepad = gamepads[i];
			if (!gamepad) continue;
			info += `\nGamepad ${i}: ${gamepad.id} connected: ${gamepad.connected}\n`;
			info += `\nAxes: ${gamepad.axes}\n`;
			info += `\nButtons: ${gamepad.buttons}\n`;
		}
		return info;
	}
}