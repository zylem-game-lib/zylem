import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';

import { ThirdPersonPerspective } from '../../../src/lib/camera/perspectives/third-person-perspective';
import type { CameraContext } from '../../../src/lib/camera/types';

function makeContext(time: number, primary: Vector3): CameraContext {
	return {
		dt: 1 / 60,
		time,
		viewport: { width: 800, height: 600, aspect: 800 / 600 },
		targets: {
			primary: { position: primary },
		},
	};
}

describe('ThirdPersonPerspective trailing-delay follow', () => {
	it('passes the current target position through unchanged when trailDelay is 0', () => {
		const persp = new ThirdPersonPerspective({
			distance: 0,
			height: 0,
			shoulderOffset: 0,
			trailDelay: 0,
		});

		const target = new Vector3(0, 0, 0);
		persp.getBasePose(makeContext(0, target));

		target.set(0, 0, 5);
		const pose = persp.getBasePose(makeContext(1, target));

		expect(pose.lookAt!.z).toBeCloseTo(5);
		expect(pose.position.z).toBeCloseTo(5);
	});

	it('returns a position from the past when trailDelay is positive', () => {
		const persp = new ThirdPersonPerspective({
			distance: 0,
			height: 0,
			shoulderOffset: 0,
			trailDelay: 0.1,
		});

		// Drive the target forward along +Z at 1 unit/s, sampling every 1/60s.
		// During the first 100ms the camera should still be reading from the
		// warmup oldest sample (~0).
		let pose;
		for (let i = 0; i < 6; i++) {
			const time = i / 60;
			pose = persp.getBasePose(makeContext(time, new Vector3(0, 0, time)));
		}
		expect(pose!.lookAt!.z).toBeLessThan(0.05);

		// After ~250ms of motion the trail is fully primed; the sampled point
		// should be ~100ms behind the live target (i.e. ~150ms position).
		for (let i = 6; i < 16; i++) {
			const time = i / 60;
			pose = persp.getBasePose(makeContext(time, new Vector3(0, 0, time)));
		}
		const liveZ = 15 / 60;
		expect(pose!.lookAt!.z).toBeCloseTo(liveZ - 0.1, 2);
	});

	it('keeps position and lookAt locked to the same trailed point', () => {
		const persp = new ThirdPersonPerspective({
			distance: 8,
			height: 5,
			shoulderOffset: 0,
			trailDelay: 0.1,
		});

		// Prime the trail with motion along +Z so the sampled point is
		// genuinely behind the live target.
		let pose;
		for (let i = 0; i < 30; i++) {
			const time = i / 60;
			pose = persp.getBasePose(makeContext(time, new Vector3(0, 0, time)));
		}

		const lookAt = pose!.lookAt!;
		const position = pose!.position;
		expect(position.x - lookAt.x).toBeCloseTo(0);
		expect(position.y - lookAt.y).toBeCloseTo(5);
		expect(position.z - lookAt.z).toBeCloseTo(8);
	});
});
