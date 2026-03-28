import { isMobile } from '../device/mobile';
import {
	VirtualTouchButtonConfig,
	VirtualTouchButtonSlot,
	VirtualTouchButtonsConfig,
	VirtualTouchConfig,
	VirtualTouchJoystickConfig,
} from '../game/game-interfaces';
import { AnalogState, ButtonState, InputGamepad, InputProvider } from './input';
import { mergeAnalogState, mergeButtonState } from './input-state';

type JoystickId = 'left' | 'right';
type AxisName = 'Horizontal' | 'Vertical' | 'SecondaryHorizontal' | 'SecondaryVertical';
type ButtonTargetCategory = 'buttons' | 'directions' | 'shoulders';

interface ResolvedButtonConfig extends VirtualTouchButtonConfig {
	label: string;
	size: number;
}

interface ResolvedJoystickConfig extends VirtualTouchJoystickConfig {
	size: number;
	thumbSize: number;
	maxDistance: number;
	deadzone: number;
	directionThreshold: number;
	horizontalAxis: 'Horizontal' | 'SecondaryHorizontal';
	verticalAxis: 'Vertical' | 'SecondaryVertical';
	emitDirections: boolean;
}

interface ButtonRuntime {
	slot: VirtualTouchButtonSlot;
	config: ResolvedButtonConfig;
	element: HTMLButtonElement;
	content: HTMLDivElement;
	pointerId: number | null;
}

interface JoystickRuntime {
	id: JoystickId;
	config: ResolvedJoystickConfig;
	element: HTMLDivElement;
	base: HTMLDivElement;
	thumb: HTMLDivElement;
	pointerId: number | null;
	centerX: number;
	centerY: number;
	rawX: number;
	rawY: number;
	valueX: number;
	valueY: number;
}

interface ButtonTarget {
	category: ButtonTargetCategory;
	property: string;
}

const BUTTON_SLOTS: VirtualTouchButtonSlot[] = [
	'A',
	'B',
	'X',
	'Y',
	'Start',
	'Select',
	'L',
	'R',
	'LTrigger',
	'RTrigger',
	'Up',
	'Down',
	'Left',
	'Right',
];

const UNIT_LESS_CSS_PROPERTIES = new Set([
	'flex',
	'flexGrow',
	'flexShrink',
	'fontWeight',
	'lineHeight',
	'opacity',
	'order',
	'zIndex',
	'zoom',
]);

const DEFAULT_TOUCH_BUTTONS: Record<VirtualTouchButtonSlot, VirtualTouchButtonConfig> = {
	A: { size: 72, label: 'A', position: { right: 98, bottom: 44 } },
	B: { size: 72, label: 'B', position: { right: 24, bottom: 108 } },
	X: { size: 72, label: 'X', position: { right: 172, bottom: 108 } },
	Y: { size: 72, label: 'Y', position: { right: 98, bottom: 172 } },
	Start: {
		size: 64,
		label: 'Start',
		position: { left: '50%', top: 24, transform: 'translateX(28px)' },
	},
	Select: {
		size: 64,
		label: 'Select',
		position: { left: '50%', top: 24, transform: 'translateX(-108px)' },
	},
	L: { size: 62, label: 'L', position: { left: 28, bottom: 184 } },
	R: { size: 62, label: 'R', position: { right: 236, bottom: 184 } },
	LTrigger: { size: 76, label: 'LT', position: { left: 24, top: 24 } },
	RTrigger: { size: 76, label: 'RT', position: { right: 24, top: 24 } },
	Up: { enabled: false, size: 64, label: 'Up' },
	Down: { enabled: false, size: 64, label: 'Down' },
	Left: { enabled: false, size: 64, label: 'Left' },
	Right: { enabled: false, size: 64, label: 'Right' },
};

const DEFAULT_TOUCH_JOYSTICKS: Record<JoystickId, VirtualTouchJoystickConfig> = {
	left: {
		size: 140,
		thumbSize: 58,
		maxDistance: 44,
		deadzone: 0.12,
		directionThreshold: 0.34,
		horizontalAxis: 'Horizontal',
		verticalAxis: 'Vertical',
		emitDirections: true,
		position: { left: 24, bottom: 24 },
	},
	right: {
		size: 140,
		thumbSize: 58,
		maxDistance: 44,
		deadzone: 0.12,
		directionThreshold: 0.34,
		horizontalAxis: 'SecondaryHorizontal',
		verticalAxis: 'SecondaryVertical',
		emitDirections: false,
		position: { right: 24, bottom: 236 },
	},
};

export class VirtualTouchProvider implements InputProvider {
	private readonly config: VirtualTouchConfig;
	private readonly targetElement: HTMLElement;
	private readonly buttonStates = new Map<string, ButtonState>();
	private readonly analogStates = new Map<string, AnalogState>();
	private readonly buttons = new Map<VirtualTouchButtonSlot, ButtonRuntime>();
	private readonly joysticks = new Map<JoystickId, JoystickRuntime>();
	private rootElement: HTMLDivElement | null = null;
	private enabled = false;

	private readonly onPointerMove = (event: PointerEvent) => {
		for (const joystick of this.joysticks.values()) {
			if (joystick.pointerId !== event.pointerId) continue;
			this.consumeEvent(event);
			this.updateJoystickFromPoint(joystick, event.clientX, event.clientY);
		}
	};

	private readonly onPointerUp = (event: PointerEvent) => {
		for (const button of this.buttons.values()) {
			if (button.pointerId === event.pointerId) {
				this.consumeEvent(event);
				this.releaseButton(button);
			}
		}

		for (const joystick of this.joysticks.values()) {
			if (joystick.pointerId === event.pointerId) {
				this.consumeEvent(event);
				this.releaseJoystick(joystick);
			}
		}
	};

	private readonly onWindowBlur = () => {
		for (const button of this.buttons.values()) {
			this.releaseButton(button);
		}
		for (const joystick of this.joysticks.values()) {
			this.releaseJoystick(joystick);
		}
	};

	constructor(config?: VirtualTouchConfig, targetElement?: HTMLElement) {
		this.config = config ?? {};
		this.targetElement = targetElement ?? document.body;
		this.enabled = this.resolveEnabledState();

		if (!this.enabled) return;

		this.mountControls();
		window.addEventListener('pointermove', this.onPointerMove);
		window.addEventListener('pointerup', this.onPointerUp);
		window.addEventListener('pointercancel', this.onPointerUp);
		window.addEventListener('blur', this.onWindowBlur);
	}

	getInput(delta: number): Partial<InputGamepad> {
		if (!this.enabled) return {};

		const input: Partial<InputGamepad> = {};

		for (const button of this.buttons.values()) {
			const state = this.handleButtonState(`button:${button.slot}`, button.pointerId !== null, delta);
			this.assignButtonState(input, this.resolveButtonTarget(button.slot), state);
		}

		for (const joystick of this.joysticks.values()) {
			const horizontal = this.handleAnalogState(`joystick:${joystick.id}:x`, joystick.valueX, delta);
			const vertical = this.handleAnalogState(`joystick:${joystick.id}:y`, joystick.valueY, delta);
			this.assignAxisState(input, joystick.config.horizontalAxis, horizontal);
			this.assignAxisState(input, joystick.config.verticalAxis, vertical);

			if (joystick.config.emitDirections) {
				this.assignButtonState(
					input,
					this.resolveButtonTarget('Left'),
					this.handleButtonState(
						`joystick:${joystick.id}:left`,
						joystick.valueX <= -joystick.config.directionThreshold,
						delta,
					),
				);
				this.assignButtonState(
					input,
					this.resolveButtonTarget('Right'),
					this.handleButtonState(
						`joystick:${joystick.id}:right`,
						joystick.valueX >= joystick.config.directionThreshold,
						delta,
					),
				);
				this.assignButtonState(
					input,
					this.resolveButtonTarget('Up'),
					this.handleButtonState(
						`joystick:${joystick.id}:up`,
						joystick.valueY <= -joystick.config.directionThreshold,
						delta,
					),
				);
				this.assignButtonState(
					input,
					this.resolveButtonTarget('Down'),
					this.handleButtonState(
						`joystick:${joystick.id}:down`,
						joystick.valueY >= joystick.config.directionThreshold,
						delta,
					),
				);
			}
		}

		return input;
	}

	getName(): string {
		return 'virtual-touch';
	}

	isConnected(): boolean {
		return this.enabled;
	}

	dispose(): void {
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
		window.removeEventListener('pointercancel', this.onPointerUp);
		window.removeEventListener('blur', this.onWindowBlur);

		this.rootElement?.remove();
		this.rootElement = null;
		this.buttons.clear();
		this.joysticks.clear();
		this.buttonStates.clear();
		this.analogStates.clear();
	}

	private resolveEnabledState(): boolean {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return false;
		}
		if (this.config.enabled === true) return true;
		if (this.config.enabled === false) return false;
		return isMobile();
	}

	private mountControls(): void {
		this.rootElement = document.createElement('div');
		this.rootElement.className = 'zylem-virtual-touch';
		this.rootElement.dataset.zylemTouchRoot = 'true';
		this.rootElement.style.position = 'absolute';
		this.rootElement.style.inset = '0';
		this.rootElement.style.pointerEvents = 'none';
		this.rootElement.style.touchAction = 'none';
		this.rootElement.style.userSelect = 'none';
		(this.rootElement.style as any).WebkitUserSelect = 'none';
		(this.rootElement.style as any).WebkitTouchCallout = 'none';
		this.rootElement.style.color = 'rgba(245, 247, 255, 0.96)';
		this.rootElement.style.zIndex = '20';
		this.appendClassName(this.rootElement, this.config.className);
		applyStyleObject(this.rootElement, this.config.style);
		this.rootElement.addEventListener('contextmenu', (event) => event.preventDefault());

		for (const [slot, config] of this.resolveButtons()) {
			this.rootElement.appendChild(this.createButton(slot, config));
		}

		for (const [id, config] of this.resolveJoysticks()) {
			this.rootElement.appendChild(this.createJoystick(id, config));
		}

		this.targetElement.appendChild(this.rootElement);
	}

	private resolveButtons(): Array<[VirtualTouchButtonSlot, ResolvedButtonConfig]> {
		if (this.config.buttons === false) {
			return [];
		}

		const overrides = this.config.buttons as VirtualTouchButtonsConfig | undefined;
		const resolved: Array<[VirtualTouchButtonSlot, ResolvedButtonConfig]> = [];

		for (const slot of BUTTON_SLOTS) {
			const base = DEFAULT_TOUCH_BUTTONS[slot];
			const override = overrides?.[slot];
			if (override === false) continue;

			const merged: ResolvedButtonConfig = {
				...base,
				...(override ?? {}),
				style: { ...base.style, ...override?.style },
				position: { ...base.position, ...override?.position },
				label: override?.label ?? base.label ?? slot,
				size: override?.size ?? base.size ?? 72,
			};

			if (merged.enabled === false) continue;
			resolved.push([slot, merged]);
		}

		return resolved;
	}

	private resolveJoysticks(): Array<[JoystickId, ResolvedJoystickConfig]> {
		if (this.config.joysticks === false) {
			return [];
		}

		const overrides = this.config.joysticks;
		const resolved: Array<[JoystickId, ResolvedJoystickConfig]> = [];

		for (const id of ['left', 'right'] as const) {
			const base = DEFAULT_TOUCH_JOYSTICKS[id];
			const override = overrides?.[id];
			if (override === false) continue;

			const merged: ResolvedJoystickConfig = {
				...base,
				...(override ?? {}),
				style: { ...base.style, ...override?.style },
				position: { ...base.position, ...override?.position },
				svg: { ...base.svg, ...override?.svg },
				size: override?.size ?? base.size ?? 140,
				thumbSize: override?.thumbSize ?? base.thumbSize ?? 58,
				maxDistance: override?.maxDistance ?? base.maxDistance ?? 44,
				deadzone: override?.deadzone ?? base.deadzone ?? 0.12,
				directionThreshold: override?.directionThreshold ?? base.directionThreshold ?? 0.34,
				horizontalAxis: override?.horizontalAxis ?? base.horizontalAxis ?? 'Horizontal',
				verticalAxis: override?.verticalAxis ?? base.verticalAxis ?? 'Vertical',
				emitDirections: override?.emitDirections ?? base.emitDirections ?? false,
			};

			if (merged.enabled === false) continue;
			resolved.push([id, merged]);
		}

		return resolved;
	}

	private createButton(slot: VirtualTouchButtonSlot, config: ResolvedButtonConfig): HTMLButtonElement {
		const button = document.createElement('button');
		const content = document.createElement('div');

		button.type = 'button';
		button.ariaLabel = config.label;
		button.className = `zylem-virtual-touch__button zylem-virtual-touch__button--${slot}`;
		button.dataset.zylemTouchButton = slot;
		button.dataset.active = 'false';
		button.style.position = 'absolute';
		button.style.width = `${config.size}px`;
		button.style.height = `${config.size}px`;
		button.style.padding = '0';
		button.style.margin = '0';
		button.style.border = '0';
		button.style.background = 'transparent';
		button.style.pointerEvents = 'auto';
		button.style.touchAction = 'none';
		button.style.cursor = 'pointer';
		button.style.appearance = 'none';
		button.style.outline = 'none';
		button.style.userSelect = 'none';
		(button.style as any).WebkitTapHighlightColor = 'transparent';
		applyStyleObject(button, config.position);
		applyStyleObject(button, config.style);
		this.appendClassName(button, config.className);

		content.className = 'zylem-virtual-touch__button-content';
		content.style.width = '100%';
		content.style.height = '100%';
		content.style.pointerEvents = 'none';
		content.style.transform = 'scale(1)';
		content.style.transformOrigin = 'center';
		content.style.transition = 'transform 120ms ease, opacity 120ms ease';
		content.style.opacity = '0.92';
		content.innerHTML = config.svg ?? createDefaultButtonSvg(config.label);

		button.appendChild(content);
		button.addEventListener('pointerdown', (event) => {
			if (!isTouchPointerEvent(event)) return;
			const runtime = this.buttons.get(slot);
			if (!runtime || runtime.pointerId !== null) return;
			this.consumeEvent(event);
			runtime.pointerId = event.pointerId;
			this.updateButtonVisual(runtime, true);
		});

		const runtime: ButtonRuntime = {
			slot,
			config,
			element: button,
			content,
			pointerId: null,
		};
		this.buttons.set(slot, runtime);

		return button;
	}

	private createJoystick(id: JoystickId, config: ResolvedJoystickConfig): HTMLDivElement {
		const element = document.createElement('div');
		const base = document.createElement('div');
		const thumb = document.createElement('div');

		element.className = `zylem-virtual-touch__joystick zylem-virtual-touch__joystick--${id}`;
		element.dataset.zylemTouchJoystick = id;
		element.dataset.active = 'false';
		element.style.position = 'absolute';
		element.style.width = `${config.size}px`;
		element.style.height = `${config.size}px`;
		element.style.pointerEvents = 'auto';
		element.style.touchAction = 'none';
		element.style.userSelect = 'none';
		applyStyleObject(element, config.position);
		applyStyleObject(element, config.style);
		this.appendClassName(element, config.className);

		base.className = 'zylem-virtual-touch__joystick-base';
		base.style.position = 'absolute';
		base.style.inset = '0';
		base.style.pointerEvents = 'none';
		base.style.opacity = '0.88';
		base.style.transition = 'opacity 120ms ease';
		base.innerHTML = config.svg?.base ?? createDefaultJoystickBaseSvg();

		thumb.className = 'zylem-virtual-touch__joystick-thumb';
		thumb.style.position = 'absolute';
		thumb.style.left = '50%';
		thumb.style.top = '50%';
		thumb.style.width = `${config.thumbSize}px`;
		thumb.style.height = `${config.thumbSize}px`;
		thumb.style.pointerEvents = 'none';
		thumb.style.transform = 'translate(-50%, -50%) translate(0px, 0px)';
		thumb.style.transition = 'transform 60ms linear, opacity 120ms ease';
		thumb.style.opacity = '0.94';
		thumb.innerHTML = config.svg?.thumb ?? createDefaultJoystickThumbSvg();

		element.append(base, thumb);

		const runtime: JoystickRuntime = {
			id,
			config,
			element,
			base,
			thumb,
			pointerId: null,
			centerX: 0,
			centerY: 0,
			rawX: 0,
			rawY: 0,
			valueX: 0,
			valueY: 0,
		};
		this.joysticks.set(id, runtime);

		element.addEventListener('pointerdown', (event) => {
			if (!isTouchPointerEvent(event)) return;
			const joystick = this.joysticks.get(id);
			if (!joystick || joystick.pointerId !== null) return;
			this.consumeEvent(event);
			const rect = joystick.element.getBoundingClientRect();
			joystick.pointerId = event.pointerId;
			joystick.centerX = rect.left + rect.width / 2;
			joystick.centerY = rect.top + rect.height / 2;
			this.updateJoystickVisual(joystick, true);
			this.updateJoystickFromPoint(joystick, event.clientX, event.clientY);
		});

		return element;
	}

	private handleButtonState(key: string, isPressed: boolean, delta: number): ButtonState {
		let state = this.buttonStates.get(key);
		if (!state) {
			state = { pressed: false, released: false, held: 0 };
			this.buttonStates.set(key, state);
		}

		state.pressed = isPressed && state.held === 0;
		state.released = !isPressed && state.held > 0;
		state.held = isPressed ? state.held + delta : 0;

		return state;
	}

	private handleAnalogState(key: string, value: number, delta: number): AnalogState {
		let state = this.analogStates.get(key);
		if (!state) {
			state = { value: 0, held: 0 };
			this.analogStates.set(key, state);
		}

		state.value = value;
		state.held = value !== 0 ? state.held + delta : 0;

		return state;
	}

	private assignAxisState(input: Partial<InputGamepad>, axis: AxisName, state: AnalogState): void {
		if (!input.axes) input.axes = {} as InputGamepad['axes'];
		input.axes[axis] = mergeAnalogState(input.axes[axis], state);
	}

	private assignButtonState(input: Partial<InputGamepad>, target: ButtonTarget, state: ButtonState): void {
		if (target.category === 'buttons') {
			input.buttons ??= {} as InputGamepad['buttons'];
			input.buttons[target.property as keyof InputGamepad['buttons']] = mergeButtonState(
				input.buttons[target.property as keyof InputGamepad['buttons']],
				state,
			);
			return;
		}

		if (target.category === 'directions') {
			input.directions ??= {} as InputGamepad['directions'];
			input.directions[target.property as keyof InputGamepad['directions']] = mergeButtonState(
				input.directions[target.property as keyof InputGamepad['directions']],
				state,
			);
			return;
		}

		input.shoulders ??= {} as InputGamepad['shoulders'];
		input.shoulders[target.property as keyof InputGamepad['shoulders']] = mergeButtonState(
			input.shoulders[target.property as keyof InputGamepad['shoulders']],
			state,
		);
	}

	private resolveButtonTarget(slot: VirtualTouchButtonSlot): ButtonTarget {
		switch (slot) {
			case 'LTrigger':
			case 'RTrigger':
				return { category: 'shoulders', property: slot };
			case 'Up':
			case 'Down':
			case 'Left':
			case 'Right':
				return { category: 'directions', property: slot };
			default:
				return { category: 'buttons', property: slot };
		}
	}

	private updateJoystickFromPoint(joystick: JoystickRuntime, clientX: number, clientY: number): void {
		const deltaX = clientX - joystick.centerX;
		const deltaY = clientY - joystick.centerY;
		const distance = Math.hypot(deltaX, deltaY);
		const limit = joystick.config.maxDistance;
		const clampFactor = distance > limit && distance > 0 ? limit / distance : 1;

		joystick.rawX = deltaX * clampFactor;
		joystick.rawY = deltaY * clampFactor;

		const normalized = applyRadialDeadzone(
			joystick.rawX / limit,
			joystick.rawY / limit,
			joystick.config.deadzone,
		);

		joystick.valueX = normalized.x;
		joystick.valueY = normalized.y;
		joystick.thumb.style.transform = `translate(-50%, -50%) translate(${joystick.rawX}px, ${joystick.rawY}px)`;
	}

	private releaseButton(button: ButtonRuntime): void {
		button.pointerId = null;
		this.updateButtonVisual(button, false);
	}

	private releaseJoystick(joystick: JoystickRuntime): void {
		joystick.pointerId = null;
		joystick.rawX = 0;
		joystick.rawY = 0;
		joystick.valueX = 0;
		joystick.valueY = 0;
		joystick.thumb.style.transform = 'translate(-50%, -50%) translate(0px, 0px)';
		this.updateJoystickVisual(joystick, false);
	}

	private updateButtonVisual(button: ButtonRuntime, active: boolean): void {
		button.element.dataset.active = String(active);
		button.content.style.transform = active ? 'scale(0.94)' : 'scale(1)';
		button.content.style.opacity = active ? '1' : '0.92';
	}

	private updateJoystickVisual(joystick: JoystickRuntime, active: boolean): void {
		joystick.element.dataset.active = String(active);
		joystick.base.style.opacity = active ? '1' : '0.88';
		joystick.thumb.style.opacity = active ? '1' : '0.94';
	}

	private consumeEvent(event: Event): void {
		if (event.cancelable) {
			event.preventDefault();
		}
		event.stopPropagation();
	}

	private appendClassName(element: HTMLElement, className?: string): void {
		if (!className) return;
		element.className = `${element.className} ${className}`.trim();
	}
}

function applyStyleObject(element: HTMLElement, styles?: object): void {
	if (!styles) return;

	for (const [key, value] of Object.entries(styles as Record<string, string | number | undefined>)) {
		if (value === undefined || value === null) continue;

		const normalized =
			typeof value === 'number' && !UNIT_LESS_CSS_PROPERTIES.has(key)
				? `${value}px`
				: String(value);

		if (key.includes('-')) {
			element.style.setProperty(key, normalized);
		} else {
			(element.style as any)[key] = normalized;
		}
	}
}

function applyRadialDeadzone(x: number, y: number, deadzone: number): { x: number; y: number } {
	const magnitude = Math.hypot(x, y);
	if (magnitude === 0 || magnitude <= deadzone) {
		return { x: 0, y: 0 };
	}

	const scaledMagnitude = Math.min(1, (magnitude - deadzone) / Math.max(1 - deadzone, 0.0001));
	const scale = scaledMagnitude / magnitude;
	return {
		x: x * scale,
		y: y * scale,
	};
}

function createDefaultButtonSvg(label: string): string {
	const safeLabel = escapeSvgText(label);
	const fontSize = safeLabel.length > 2 ? 24 : 34;

	return `
		<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
			<circle cx="50" cy="50" r="45" fill="rgba(12,18,24,0.72)" stroke="currentColor" stroke-width="4" />
			<circle cx="50" cy="50" r="34" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
			<text
				x="50"
				y="56"
				text-anchor="middle"
				font-family="ui-sans-serif, system-ui, sans-serif"
				font-size="${fontSize}"
				font-weight="700"
				fill="currentColor"
			>${safeLabel}</text>
		</svg>
	`;
}

function createDefaultJoystickBaseSvg(): string {
	return `
		<svg viewBox="0 0 140 140" width="100%" height="100%" aria-hidden="true">
			<circle cx="70" cy="70" r="62" fill="rgba(10,16,20,0.64)" stroke="currentColor" stroke-width="4" />
			<circle cx="70" cy="70" r="40" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" />
		</svg>
	`;
}

function createDefaultJoystickThumbSvg(): string {
	return `
		<svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
			<circle cx="32" cy="32" r="28" fill="rgba(22,30,38,0.9)" stroke="currentColor" stroke-width="3.5" />
		</svg>
	`;
}

function escapeSvgText(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function isTouchPointerEvent(event: PointerEvent): boolean {
	return event.pointerType === 'touch';
}
