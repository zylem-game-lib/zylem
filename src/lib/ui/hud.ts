import { Vector2 } from 'three';
import { Application, TextStyle, Text, Graphics, FillStyle, DisplayObject } from 'pixi.js';
import { ZylemBlue } from '../interfaces/utility';
import { observe } from '@simplyianm/legend-state';
import { state$ } from '../state/game-state';

export interface HUDTextOptions {
	binding?: string | null;
	bindings?: string[] | null;
	update: null | ((element: Text, value: any) => void);
	position?: Vector2;
	style?: any;
}

export class ZylemHUD {
	_app: Application | null = null;
	_hudText: Map<Vector2, Text>;
	_frame: Graphics;

	static defaultStyleParams = {
		fontFamily: 'Tahoma',
		fontSize: 36,
		fontWeight: 'bold',
		fill: ['#000', ZylemBlue],
		stroke: '#fff',
		strokeThickness: 4,
		wordWrap: true,
		wordWrapWidth: 440,
		lineJoin: 'round',
	};

	constructor() {
		this._hudText = new Map();
		this._frame = new Graphics();
	}

	createUI() {
		const canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas') as HTMLCanvasElement;
		canvas.classList.add('zylem-game-ui');
		const uiStyle = document.createElement('style');
		uiStyle.textContent = `
			.zylem-game-ui {
				position: fixed;
				top: 0;
				bottom: 0;
				left: 0;
				right: 0;
			}
		`;
		document.head.appendChild(uiStyle);
		const app = new Application({
			backgroundAlpha: 0,
			resizeTo: window,
			view: canvas
		});
		this._app = app;
		document.body.appendChild(canvas);

		const width = canvas.width;
		const height = canvas.height;

		this.updateFrame(width, height);
		app.stage.addChild(this._frame as DisplayObject);
	}

	updateFrame(width: number, height: number) {
		this._frame.clear();
		this._frame.lineStyle({ width: 6, color: ZylemBlue });
		this._frame.drawRect(0, 0, width, height);
	}

	addText(text: string, options?: HUDTextOptions, x: number = 0, y: number = 0): void {
		if (!this._app) {
			console.warn('Missing HUD to add text to');
			return;
		}

		const useOptions: HUDTextOptions = options
			? { ...options, style: options.style ?? ZylemHUD.defaultStyleParams }
			: { bindings: null, update: null, style: ZylemHUD.defaultStyleParams };

		const textStyle = new TextStyle(useOptions.style);
		const richText = new Text(text, textStyle);

		const screenWidth = this._app.stage.width;
		const screenHeight = this._app.stage.height;

		const usePosition = new Vector2(
			useOptions?.position?.x ?? x,
			useOptions?.position?.y ?? y
		);

		this.updateTextPosition(usePosition, richText, screenWidth, screenHeight);

		richText.anchor.set(0.5, 0.5);

		const addedText = this._app.stage.addChild(richText as DisplayObject);
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

	updateTextPosition(position: Vector2, text: Text, width: number, height: number) {
		const percentX = position.x;
		const percentY = position.y;

		text.x = width / (100 / percentX);
		text.y = height / (100 / percentY);
	}

	resize(width: number, height: number) {
		if (this._app) {
			this._app.view.width = width;
			this._app.view.height = height;
			this.updateFrame(width, height);
			this._hudText.forEach((value, key) => {
				this.updateTextPosition(key, value, width, height);
			});
			this._app.resize();
		}
	}
}