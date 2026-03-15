import { describe, expect, it } from 'vitest';

import { createCamera } from '../../../src/lib/camera/camera';

describe('createCamera vector inputs', () => {
	it('accepts object and tuple vector inputs for camera configuration', () => {
		const camera = createCamera({
			position: { x: 3, y: 4 },
			target: [0, 2, -5],
			screenResolution: [800, 600],
		});

		expect(camera.cameraRef.camera.position.toArray()).toEqual([3, 4, 0]);
		expect(camera.cameraRef.screenResolution.toArray()).toEqual([800, 600]);
	});
});
