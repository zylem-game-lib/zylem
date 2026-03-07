import { describe, expect, it } from 'vitest';
import { AspectRatio, AspectRatioDelegate } from '../../../src/lib/device/aspect-ratio';

function setElementSize(element: HTMLElement, width: number, height: number): void {
	Object.defineProperty(element, 'clientWidth', {
		configurable: true,
		get: () => width,
	});
	Object.defineProperty(element, 'clientHeight', {
		configurable: true,
		get: () => height,
	});
	element.getBoundingClientRect = () =>
		({
			width,
			height,
			top: 0,
			right: width,
			bottom: height,
			left: 0,
			x: 0,
			y: 0,
			toJSON: () => ({}),
		}) as DOMRect;
}

describe('AspectRatioDelegate', () => {
	it('sizes from width when the container has no explicit height', () => {
		const container = document.createElement('div');
		const canvas = document.createElement('canvas');

		setElementSize(container, 360, 0);

		const delegate = new AspectRatioDelegate({
			container,
			canvas,
			aspectRatio: AspectRatio.NineBySixteen,
		});

		expect(delegate.measure()).toEqual({ width: 360, height: 640 });
	});

	it('fits inside a bounded container while preserving aspect ratio', () => {
		const container = document.createElement('div');
		const canvas = document.createElement('canvas');

		setElementSize(container, 390, 844);

		const delegate = new AspectRatioDelegate({
			container,
			canvas,
			aspectRatio: AspectRatio.FourByThree,
		});

		expect(delegate.measure()).toEqual({ width: 390, height: 293 });
	});
});
