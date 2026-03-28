import { afterEach, describe, expect, it } from 'vitest';
import { VirtualTouchProvider } from '../../../src/lib/input/virtual-touch-provider';

function setElementRect(element: HTMLElement, rect: { left: number; top: number; width: number; height: number }): void {
	element.getBoundingClientRect = () =>
		({
			left: rect.left,
			top: rect.top,
			width: rect.width,
			height: rect.height,
			right: rect.left + rect.width,
			bottom: rect.top + rect.height,
			x: rect.left,
			y: rect.top,
			toJSON: () => ({}),
		}) as DOMRect;
}

function createPointerEvent(
	type: string,
	init: { pointerId: number; clientX?: number; clientY?: number; pointerType?: string },
): PointerEvent {
	const event = new Event(type, {
		bubbles: true,
		cancelable: true,
	}) as PointerEvent;

	Object.defineProperties(event, {
		pointerId: { configurable: true, value: init.pointerId },
		pointerType: { configurable: true, value: init.pointerType ?? 'touch' },
		clientX: { configurable: true, value: init.clientX ?? 0 },
		clientY: { configurable: true, value: init.clientY ?? 0 },
	});

	return event;
}

describe('VirtualTouchProvider', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('captures joystick movement as axes and direction buttons and resets on release', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const provider = new VirtualTouchProvider(
			{
				enabled: true,
				buttons: false,
				joysticks: {
					left: {
						size: 120,
						thumbSize: 48,
						maxDistance: 40,
						deadzone: 0,
						directionThreshold: 0.4,
					},
					right: false,
				},
			},
			host,
		);

		expect(host.querySelector('[data-zylem-touch-root="true"]')).not.toBeNull();

		const joystick = host.querySelector('[data-zylem-touch-joystick="left"]') as HTMLElement;
		setElementRect(joystick, {
			left: 40,
			top: 50,
			width: 120,
			height: 120,
		});

		joystick.dispatchEvent(createPointerEvent('pointerdown', {
			pointerId: 1,
			clientX: 100,
			clientY: 110,
		}));
		window.dispatchEvent(createPointerEvent('pointermove', {
			pointerId: 1,
			clientX: 120,
			clientY: 100,
		}));

		const active = provider.getInput(0.25);
		expect(active.axes?.Horizontal.value).toBeCloseTo(0.5);
		expect(active.axes?.Vertical.value).toBeCloseTo(-0.25);
		expect(active.axes?.Horizontal.held).toBeCloseTo(0.25);
		expect(active.directions?.Right.pressed).toBe(true);
		expect(active.directions?.Right.held).toBeCloseTo(0.25);
		expect(active.directions?.Up.pressed).toBe(false);

		window.dispatchEvent(createPointerEvent('pointerup', {
			pointerId: 1,
			clientX: 120,
			clientY: 100,
		}));

		const released = provider.getInput(0.25);
		expect(released.axes?.Horizontal.value).toBe(0);
		expect(released.axes?.Vertical.value).toBe(0);
		expect(released.directions?.Right.released).toBe(true);

		provider.dispose();
		expect(host.querySelector('[data-zylem-touch-root="true"]')).toBeNull();
	});

	it('tracks touch buttons and ignores mouse pointers', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		const provider = new VirtualTouchProvider(
			{
				enabled: true,
				joysticks: false,
			},
			host,
		);

		const button = host.querySelector('[data-zylem-touch-button="A"]') as HTMLElement;

		button.dispatchEvent(createPointerEvent('pointerdown', {
			pointerId: 1,
			pointerType: 'mouse',
		}));

		const ignored = provider.getInput(0.1);
		expect(ignored.buttons?.A.pressed).toBe(false);
		expect(ignored.buttons?.A.held).toBe(0);

		button.dispatchEvent(createPointerEvent('pointerdown', {
			pointerId: 2,
			pointerType: 'touch',
		}));

		const pressed = provider.getInput(0.1);
		expect(pressed.buttons?.A.pressed).toBe(true);
		expect(pressed.buttons?.A.held).toBeCloseTo(0.1);

		const held = provider.getInput(0.1);
		expect(held.buttons?.A.pressed).toBe(false);
		expect(held.buttons?.A.held).toBeCloseTo(0.2);

		window.dispatchEvent(createPointerEvent('pointerup', {
			pointerId: 2,
		}));

		const released = provider.getInput(0.1);
		expect(released.buttons?.A.released).toBe(true);
		expect(released.buttons?.A.held).toBe(0);

		provider.dispose();
	});
});
