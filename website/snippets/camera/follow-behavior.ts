import { createCamera, createFollowTarget, Perspectives } from '@zylem/game-lib/core';

export function attachFollowCamera() {
	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		behaviors: {
			follow: createFollowTarget({
				targetKey: 'primary',
				offset: { x: 0, y: 3, z: 8 },
				lerpFactor: 0.12,
			}),
		},
	});

	return camera;
}
