import { Vector3 } from 'three';
import { gameState } from '../state/index';
import SpriteText from 'three-spritetext';
import { ZylemCamera } from '~/lib/rendering/ZylemCamera';

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
	cameraRef: ZylemCamera;

	constructor(zylemCamera: ZylemCamera) {
		this._hudText = [];
		this.cameraRef = zylemCamera;
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
		const { x: camX, y: camY, z: camZ } = this.cameraRef.cameraRig.position;
		this._hudText.forEach(hud => {
			const { binding } = hud;
			if (!binding) {
				return;
			}
			const globals = gameState.globals;
			const value = `${globals[binding]}`;
			if (value) {
				const { x, y, z } = hud.position;
				hud.sprite.position.set(x + camX, y + camY, z + camZ);
				hud.sprite.text = value;
			}
		})
	}
}