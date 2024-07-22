import { Vector2 } from 'three';
import { Application, Color, FillGradient, StrokeStyle, Text, TextStyle, TextStyleOptions } from 'pixi.js';

import { HUDControl, HUDOptions, createBindings } from './hud';
import { ZylemBlue } from '../interfaces/utility';

export interface HUDLabelOptions {
	style: TextStyleOptions;
	position: Vector2;
}


const HUD_LABEL_DEFAULTS: HUDLabelOptions = {
	style: {
		fontFamily: 'Tahoma',
		fontSize: 36,
		fontWeight: 'bold',
		fill: new FillGradient(0,0,0,0),
		stroke: {
			color: '#ffffff',
			width: 4,
			join: 'round'
		},
		wordWrap: true,
		wordWrapWidth: 440
	},
	position: new Vector2(20, 20),
}

type HUDOptionParams = Partial<HUDLabelOptions & HUDOptions<HUDLabel>>;

export class HUDLabel implements HUDControl {
	_app: Application;
	_labelOptions: HUDLabelOptions = HUD_LABEL_DEFAULTS;
	_text: Text;

	constructor(app: Application) {
		this._app = app;
		this.setupDefaults();
		this._text = new Text();
	}

	setupDefaults() {
		const fill = new FillGradient(0, 0, 0, 24);
		const colors = [0x000000, ZylemBlue].map((color) => Color.shared.setValue(color).toNumber());
		colors.forEach((num, index) => {
			const ratio = index / colors.length;
			fill.addColorStop(ratio, num);
		})
		this._labelOptions.style.fill = fill;
	}

	addLabel(options: HUDOptionParams) {
		this.addText('', options);
	}

	addText(text: string, options?: HUDOptionParams, x: number = 0, y: number = 0): void {
		const useOptions: HUDLabelOptions = Object.assign({}, HUD_LABEL_DEFAULTS, options);
		const useStyleOptions = Object.assign({}, useOptions.style, options?.style);

		const textStyle = new TextStyle(useStyleOptions as TextStyleOptions);
		const richText = new Text({ text, style: textStyle });

		const usePosition = new Vector2(
			useOptions?.position?.x ?? x,
			useOptions?.position?.y ?? y
		);

		richText.anchor.set(0, 0);
		richText.position.set(usePosition.x, usePosition.y);

		this._text = this._app.stage.addChild(richText);
		createBindings(this, useOptions);
	}

	updateText(text: string, style: any = null) {
		// TODO: add style changes
		this._text.text = text;
	}

}