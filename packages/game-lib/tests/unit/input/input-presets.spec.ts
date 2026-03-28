import { describe, expect, it } from 'vitest';
import { mergeInputConfigs, useVirtualControls } from '../../../src/lib/input/input-presets';

describe('virtual touch input presets', () => {
	it('deep-merges touch configuration for the same player', () => {
		const merged = mergeInputConfigs(
			{
				p1: {
					touch: {
						style: { opacity: 0.7 },
						joysticks: {
							left: {
								size: 132,
								position: { left: 12 },
								style: { opacity: 0.6 },
							},
						},
						buttons: {
							A: {
								size: 80,
								position: { right: 48 },
								style: { color: '#fff' },
							},
							B: false,
						},
					},
				},
			},
			{
				p1: {
					touch: {
						style: { zIndex: 30 },
						joysticks: {
							left: {
								maxDistance: 46,
								position: { bottom: 24 },
							},
							right: false,
						},
						buttons: {
							A: {
								position: { bottom: 52 },
								style: { opacity: 0.9 },
							},
							Start: {
								label: 'Go',
							},
						},
					},
				},
			},
		);

		expect(merged.p1?.touch?.style).toEqual({
			opacity: 0.7,
			zIndex: 30,
		});
		expect(merged.p1?.touch?.joysticks).toEqual({
			left: {
				size: 132,
				maxDistance: 46,
				position: {
					left: 12,
					bottom: 24,
				},
				style: {
					opacity: 0.6,
				},
			},
			right: false,
		});
		expect(merged.p1?.touch?.buttons).toEqual({
			A: {
				size: 80,
				position: {
					right: 48,
					bottom: 52,
				},
				style: {
					color: '#fff',
					opacity: 0.9,
				},
			},
			B: false,
			Start: {
				label: 'Go',
			},
		});
	});

	it('creates an auto-enabled virtual touch preset by default', () => {
		const config = useVirtualControls('p2', {
			buttons: false,
		});

		expect(config).toEqual({
			p2: {
				touch: {
					enabled: 'auto',
					buttons: false,
				},
			},
		});
	});
});
