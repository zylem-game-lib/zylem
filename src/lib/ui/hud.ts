import { Vector2 } from 'three';
import { Application, TextStyle, Text, Graphics } from 'pixi.js';
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
	_hudText: Map<string, Text>;

	static defaultStyleParams = {
		fontFamily: 'Tahoma',
		fontSize: 36,
		fontStyle: 'italic',
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
		const frame = new Graphics();

		frame.lineStyle({ width: 6, color: ZylemBlue });
		frame.drawRect(0, 0, width, height);

		app.stage.addChild(frame);
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

		richText.x = useOptions?.position?.x ?? x;
		richText.y = useOptions?.position?.y ?? y;

		const addedText = this._app.stage.addChild(richText);
		if (options?.binding && options.update) {
			const key = options.binding;
			const updateFn = options.update;
			observe(() => {
				const value = state$.globals[key].get();
				updateFn(addedText, value);
			});
		}
	}
}