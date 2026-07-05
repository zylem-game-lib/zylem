/**
 * Helpers for binding shader uniforms to showcase controls.
 */
import type { Color } from 'three';
import type { ColorControl, RangeControl } from '../../demo-types';

/** Slider bound to a numeric uniform. */
export function rangeControl(
	label: string,
	uniform: { value: number },
	min: number,
	max: number,
	step: number,
): RangeControl {
	return {
		type: 'range',
		label,
		min,
		max,
		step,
		value: uniform.value,
		onChange: value => {
			uniform.value = value;
		},
	};
}

/** Color picker bound to a `Color` uniform. */
export function colorControl(label: string, uniform: { value: Color }): ColorControl {
	return {
		type: 'color',
		label,
		value: `#${uniform.value.getHexString()}`,
		onChange: hex => {
			uniform.value.set(hex);
		},
	};
}
