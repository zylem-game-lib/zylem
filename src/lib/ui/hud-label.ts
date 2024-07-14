import { Vector2 } from 'three';
import { Application, Color, FillGradient, Text, TextStyle } from 'pixi.js';
import { observe } from '@simplyianm/legend-state';

import { HUDControl, HUDOptions } from './hud';
import { ZylemBlue } from '../interfaces/utility';
import { state$ } from '../state';

export interface HUDTextOptions extends HUDOptions<Text> {
	style?: any;
}

export class HUDLabel implements HUDControl {
	_hudText: Map<Vector2, Text> = new Map();
	_app: Application;

	static defaultStyleParams = {
		fontFamily: 'Tahoma',
		fontSize: 36,
		fontWeight: 'bold',
		fill: new FillGradient(0,0,0,0),
		stroke: { color: '#ffffff', width: 2, join: 'round' },
		strokeThickness: 4,
		wordWrap: true,
		wordWrapWidth: 440,
		lineJoin: 'round',
	};

	constructor(app: Application) {
		this._app = app;
		this.setupDefaults();
	}

	setupDefaults() {
		const fill = new FillGradient(0, 0, 0, 24);
		const colors = [0x000000, ZylemBlue].map((color) => Color.shared.setValue(color).toNumber());
		colors.forEach((num, index) => {
			const ratio = index / colors.length;
			fill.addColorStop(ratio, num);
		})
		HUDLabel.defaultStyleParams.fill = fill;
	}

	addText(text: string, options?: HUDTextOptions, x: number = 0, y: number = 0): void {
		const useOptions: HUDTextOptions = options
			? { ...options, style: options.style ?? HUDLabel.defaultStyleParams }
			: { bindings: null, update: null, style: HUDLabel.defaultStyleParams };

		const textStyle = new TextStyle(useOptions.style);
		const richText = new Text({ text, style: textStyle });

		const usePosition = new Vector2(
			useOptions?.position?.x ?? x,
			useOptions?.position?.y ?? y
		);

		richText.anchor.set(0.5, 0.5);
		richText.position.set(usePosition.x, usePosition.y);

		const addedText = this._app.stage.addChild(richText);
		if (options?.binding && options.update) {
			const key = options.binding;
			const updateFn = options.update;
			observe(() => {
				const value = state$.globals[key].get();
				updateFn(addedText as Text, value);
			});
		}
		this._hudText.set(usePosition, richText);
	}

}