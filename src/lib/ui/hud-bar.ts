import { Application, FillGradient, Graphics } from "pixi.js";

import { HUDControl } from "./hud";
import { ZylemBlue } from "../interfaces/utility";

export class HUDBar implements HUDControl {
	_app: Application;

	constructor(app: Application) {
		this._app = app;
	}

	addBar(colors = [0xff0000, 0x330000]) {
		const colorStops = colors;
		const gradientFill = new FillGradient(20, 20, 20, 70);

		colorStops.forEach((number, index) => {
			const ratio = index / colorStops.length;
			gradientFill.addColorStop(ratio, number);
		});

		const bar = new Graphics()
			.roundRect(20, 20, 300, 20, 4)
			.fill(gradientFill)
			.roundRect(18, 18, 302, 22, 4)
			.setStrokeStyle({ alignment: 0.5 })
			.stroke({ width: 4, color: ZylemBlue });
		
		this._app?.stage.addChild(bar);
	}

}