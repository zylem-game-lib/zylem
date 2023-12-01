import { Vector3 } from 'three';
import { gameState } from '../state/index';
import SpriteText from 'three-spritetext';

export interface HUDTextOptions {
	text: string;
	binding: string;
	position: Vector3;
}

export interface HUDText {
	sprite: SpriteText;
	binding: string;
	position: Vector3;
}

export class ZylemHUD {
	_hudText: HUDText[];

	constructor() {
		this._hudText = [];
	}

	createText({ text, binding, position }: HUDTextOptions) {
		const spriteText = new SpriteText(text);
		spriteText.textHeight = 2;
		const hudText = {
			sprite: spriteText,
			binding,
			position
		}
		this._hudText.push(hudText);
	}

	update() {
		if (!this._hudText) {
			return;
		}
		this._hudText.forEach(hud => {
			const { binding } = hud;
			if (!binding) {
				return;
			}
			const globals = gameState.globals;
			const value = `${globals[binding]}`;
			if (value) {
				hud.sprite.text = value;
			}
		})
	}
}