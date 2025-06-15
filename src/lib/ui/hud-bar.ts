// import { Vector2 } from 'three';
// // import { Application, FillGradient, Graphics, StrokeInput } from 'pixi.js';

// import { ZylemBlue } from '../core/utility';
// import { HUDControl, HUDOptions, createBindings } from './hud';

// export interface HUDBarOptions {
// 	// color?: number;
// 	// colors?: number[];
// 	// gradient?: FillGradient;
// 	// stroke: StrokeInput;
// 	// roundness?: number;
// 	// position: Vector2;
// 	// width: number;
// 	// height: number;
// 	// backgroundColor?: number;
// 	// backgroundColors?: number[];
// 	// backgroundGradient?: FillGradient;
// 	// transitionColor?: number;
// 	// transitionColors?: number[];
// 	// transitionGradient?: FillGradient;
// 	// isVertical: boolean;
// }

// const HUD_BAR_DEFAULTS: HUDBarOptions = {
// 	// color: 0,
// 	// colors: [0xff0000, 0x330000],
// 	// gradient: new FillGradient(20, 20, 20, 70),
// 	// stroke: { alignment: 0.5, width: 4, color: ZylemBlue },
// 	// roundness: 4,
// 	// position: new Vector2(20, 20),
// 	// width: 300,
// 	// height: 20,
// 	// backgroundColor: 0,
// 	// backgroundColors: [0x110000, 0x110022],
// 	// backgroundGradient: new FillGradient(20, 20, 20, 70),
// 	// transitionColor: 0,
// 	// transitionColors: [0xffdddd, 0xffffff],
// 	// transitionGradient: new FillGradient(20, 20, 20, 70),
// 	// isVertical: false,
// };

// type HUDOptionParams = Partial<HUDBarOptions & HUDOptions<HUDBar>>;

// export class HUDBar implements HUDControl {
// 	// _app: Application;
// 	// _bar: Graphics;
// 	// _barOptions = HUD_BAR_DEFAULTS;

// 	// constructor(app: Application) {
// 	// 	this._app = app;
// 	// 	this._bar = new Graphics();
// 	// }

// 	// generateGradient(color: number, colors: Array<number>, gradient: FillGradient) {
// 	// 	const colorStops = color ? [color] : colors;

// 	// 	colorStops.forEach((number, index) => {
// 	// 		const ratio = index / colorStops.length;
// 	// 		gradient?.addColorStop(ratio, number);
// 	// 	});

// 	// 	return gradient;
// 	// }

// 	// addBar(options: HUDOptionParams) {
// 	// 	const useOptions = Object.assign({}, HUD_BAR_DEFAULTS, options);
// 	// 	this._barOptions = useOptions;

// 	// 	const { gradient, color, colors, backgroundColor, backgroundColors, backgroundGradient, position, width, height, roundness, stroke } = this._barOptions;
// 	// 	this._barOptions.gradient = this.generateGradient(color ?? 0, colors ?? [], gradient ?? new FillGradient(0, 0, 1, 1));
// 	// 	this._barOptions.backgroundGradient = this.generateGradient(backgroundColor ?? 0, backgroundColors ?? [], backgroundGradient ?? new FillGradient(0, 0, 1, 1));

// 	// 	const bar = new Graphics()
// 	// 		.roundRect(position.x, position.y, width, height, roundness)
// 	// 		.fill(gradient)
// 	// 		.roundRect(position.x, position.y, width, height, roundness)
// 	// 		.setStrokeStyle(stroke)
// 	// 		.stroke();

// 	// 	this._app.stage.addChild(bar);
// 	// 	this._bar = bar;

// 	// 	createBindings(this, this._barOptions);
// 	// }

// 	// updateBar(values: any) {
// 	// 	const { position, height, width, stroke, backgroundGradient, gradient, roundness } = this._barOptions;
// 	// 	const [currentValue, maxValue] = values;
// 	// 	const newAmount = (Math.min(currentValue, maxValue) / maxValue) * width;

// 	// 	const { x, y } = position;
// 	// 	this._bar
// 	// 		.clear()
// 	// 		.roundRect(x, y, width, height, roundness)
// 	// 		.fill(backgroundGradient)
// 	// 		.setStrokeStyle(stroke ?? {})
// 	// 		.stroke()
// 	// 		.roundRect(x, y, newAmount, height, roundness)
// 	// 		.fill(gradient);
// 	// }
// }
