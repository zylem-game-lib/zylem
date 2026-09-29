import { describe, expect, it } from 'vitest';
import { Quaternion, Vector3 } from 'three';

import { createPlatformFollow } from '../../../src/lib/camera/behaviors/platform-follow';
import { createStrategyPan } from '../../../src/lib/camera/behaviors/strategy-pan';
import type { CameraContext, CameraPose } from '../../../src/lib/camera/types';

const DT = 1 / 60;

function context(position: Vector3, time = 0): CameraContext {
	return {
		dt: DT,
		time,
		viewport: { width: 800, height: 600, aspect: 800 / 600 },
		targets: { primary: { position } },
	};
}

/** A perspective pose framed on the live target with a fixed offset. */
function framed(target: Vector3, offset = new Vector3(0, 10, 0)): CameraPose {
	return {
		position: target.clone().add(offset),
		rotation: new Quaternion(),
		lookAt: target.clone(),
	};
}

describe('createPlatformFollow', () => {
	it('holds Y through a jump and eases after the landing settles', () => {
		const behavior = createPlatformFollow({
			axes: { x: 'off', y: 'settle', z: 'off' },
			settleSpeed: 1,
			settleTime: 0.08,
			settleLerp: 0.5,
		});
		const target = new Vector3(0, 0, 0);

		behavior.update(context(target, 0), framed(target));

		target.y = 4;
		const airborne = behavior.update(context(target, DT), framed(target));
		expect(airborne.lookAt!.y).toBeCloseTo(0);

		let settled = airborne;
		for (let frame = 0; frame < 6; frame += 1) {
			settled = behavior.update(context(target, DT * (frame + 2)), framed(target));
		}
		expect(settled.lookAt!.y).toBeGreaterThan(0.5);
		expect(settled.lookAt!.y).toBeLessThan(4);

		const caughtUp = behavior.update(context(target, 1), framed(target));
		expect(caughtUp.lookAt!.y).toBeGreaterThan(settled.lookAt!.y);
	});

	it('lags on a delay axis', () => {
		const behavior = createPlatformFollow({
			axes: { x: 'delay', y: 'off', z: 'off' },
			lerpFactor: 0.2,
		});
		const target = new Vector3(0, 0, 0);
		behavior.update(context(target), framed(target));

		target.x = 10;
		const pose = behavior.update(context(target, DT), framed(target));
		expect(pose.lookAt!.x).toBeGreaterThan(0);
		expect(pose.lookAt!.x).toBeLessThan(10);
		expect(pose.position.x - pose.lookAt!.x).toBeCloseTo(0);
		expect(pose.position.y - pose.lookAt!.y).toBeCloseTo(10);
	});

	it('holds a horizontal settle axis through a lane change', () => {
		const behavior = createPlatformFollow({
			axes: { x: 'settle', y: 'off', z: 'off' },
			settleSpeed: 1,
			settleTime: 0.2,
		});
		const target = new Vector3(0, 0, 0);
		behavior.update(context(target), framed(target));

		target.x = 6;
		const pose = behavior.update(context(target, DT), framed(target));
		expect(pose.lookAt!.x).toBeCloseTo(0);
	});
});

describe('createStrategyPan', () => {
	const base: CameraPose = {
		position: new Vector3(0, 12, 0),
		rotation: new Quaternion(),
		lookAt: new Vector3(0, 0, 0),
	};

	it('pans from arrow input and from the screen edge', () => {
		let input = { pan: { x: 1, y: 0 } };
		const arrows = createStrategyPan({
			sampleInput: () => input,
			panSpeed: 10,
			edgeSpeed: 10,
		});
		const panned = arrows.update({ ...context(new Vector3()), dt: 0.1 }, base);
		expect(panned.lookAt!.x).toBeCloseTo(1);
		expect(panned.position.x).toBeCloseTo(1);
		expect(panned.position.y).toBeCloseTo(12);

		input = { pan: { x: 0, y: 0 }, pointer: { x: 0, y: 0.5 } };
		const edge = createStrategyPan({
			sampleInput: () => input,
			edgeMargin: 0.1,
			edgeSpeed: 10,
		});
		const scrolled = edge.update({ ...context(new Vector3()), dt: 0.1 }, base);
		expect(scrolled.lookAt!.x).toBeLessThan(0);
	});

	it('follows a target until a manual pan, then again after setFollowKey', () => {
		let pan = { x: 0, y: 0 };
		const target = new Vector3(0, 0, 0);
		const behavior = createStrategyPan({
			sampleInput: () => ({ pan }),
			followKey: 'primary',
			followLerp: 1,
			panSpeed: 10,
		});

		target.set(5, 0, 0);
		const followed = behavior.update(context(target), base);
		expect(followed.lookAt!.x).toBeCloseTo(5);

		pan = { x: 1, y: 0 };
		const broken = behavior.update({ ...context(target), dt: 0.1 }, base);
		// Pan is applied on top of the followed focus, and the perspective pose
		// is re-framed at the origin each frame, so the result is the focus itself.
		expect(broken.lookAt!.x).toBeCloseTo(6);

		pan = { x: 0, y: 0 };
		target.set(20, 0, 0);
		const stayed = behavior.update(context(target), base);
		expect(stayed.lookAt!.x).toBeCloseTo(6);

		behavior.setFollowKey('primary');
		const resumed = behavior.update(context(target), base);
		expect(resumed.lookAt!.x).toBeCloseTo(20);
	});
});
