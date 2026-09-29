import { describe, expect, it } from 'vitest';
import { OrthographicCamera, PerspectiveCamera, Quaternion, Vector3 } from 'three';

import { createCamera } from '../../../src/lib/camera/camera';
import { IsometricPerspective } from '../../../src/lib/camera/perspectives/isometric-perspective';
import { SecondPersonPerspective } from '../../../src/lib/camera/perspectives/second-person-perspective';
import { TopDownPerspective } from '../../../src/lib/camera/perspectives/top-down-perspective';
import type { CameraContext } from '../../../src/lib/camera/types';

function context(targets: CameraContext['targets']): CameraContext {
	return {
		dt: 1 / 60,
		time: 0,
		viewport: { width: 800, height: 600, aspect: 800 / 600 },
		targets,
	};
}

describe('TopDownPerspective', () => {
	it('sits above the target and looks straight down', () => {
		const pose = new TopDownPerspective({ height: 10, zoom: 12 }).getBasePose(
			context({ primary: { position: new Vector3(3, 1, 4) } }),
		);

		expect(pose.position.x).toBeCloseTo(3);
		expect(pose.position.y).toBeCloseTo(11);
		expect(pose.position.z).toBeCloseTo(4);
		expect(pose.lookAt!.x).toBeCloseTo(3);
		expect(pose.lookAt!.y).toBeCloseTo(1);
		expect(pose.lookAt!.z).toBeCloseTo(4);
		expect(pose.zoom).toBe(12);
		expect(pose.fov).toBeUndefined();
	});

	it('keeps the same offset when the target moves', () => {
		const persp = new TopDownPerspective({ height: 8 });
		const target = new Vector3(0, 0, 0);
		const first = persp.getBasePose(context({ primary: { position: target } }));
		target.set(2, 3, -1);
		const second = persp.getBasePose(context({ primary: { position: target } }));

		expect(second.position.x - second.lookAt!.x).toBeCloseTo(first.position.x - first.lookAt!.x);
		expect(second.position.y - second.lookAt!.y).toBeCloseTo(8);
		expect(second.position.z - second.lookAt!.z).toBeCloseTo(0);
	});

	it('uses the initial pose when there is no target', () => {
		const pose = new TopDownPerspective({
			initialPosition: { x: 1, y: 20, z: 2 },
			initialLookAt: { x: 1, y: 0, z: 2 },
		}).getBasePose(context({}));

		expect(pose.position.y).toBeCloseTo(20);
		expect(pose.lookAt!.y).toBeCloseTo(0);
	});
});

describe('IsometricPerspective', () => {
	it('offsets the camera equally on X, Y, and Z', () => {
		const pose = new IsometricPerspective({ distance: Math.sqrt(3), zoom: 14 }).getBasePose(
			context({ primary: { position: new Vector3(0, 0, 0) } }),
		);

		expect(pose.position.x).toBeCloseTo(1);
		expect(pose.position.y).toBeCloseTo(1);
		expect(pose.position.z).toBeCloseTo(1);
		expect(pose.lookAt!.length()).toBeCloseTo(0);
		expect(pose.zoom).toBe(14);
		expect(pose.fov).toBeUndefined();
	});

	it('keeps that world-locked direction when the target moves', () => {
		const persp = new IsometricPerspective({ distance: Math.sqrt(3) });
		const target = new Vector3(4, 2, -3);
		const pose = persp.getBasePose(context({ primary: { position: target } }));

		expect(pose.position.x - pose.lookAt!.x).toBeCloseTo(1);
		expect(pose.position.y - pose.lookAt!.y).toBeCloseTo(1);
		expect(pose.position.z - pose.lookAt!.z).toBeCloseTo(1);
	});

	it('uses the initial pose when there is no target', () => {
		const pose = new IsometricPerspective({
			initialPosition: { x: 5, y: 5, z: 5 },
			initialLookAt: { x: 0, y: 0, z: 0 },
		}).getBasePose(context({}));

		expect(pose.position.x).toBeCloseTo(5);
		expect(pose.lookAt!.x).toBeCloseTo(0);
	});
});

describe('SecondPersonPerspective', () => {
	it('looks from the anchor at the subject', () => {
		const pose = new SecondPersonPerspective({ eyeHeight: 1.5 }).getBasePose(context({
			anchor: { position: new Vector3(0, 0, 6) },
			primary: { position: new Vector3(2, 0, 0) },
		}));

		expect(pose.position.x).toBeCloseTo(0);
		expect(pose.position.y).toBeCloseTo(1.5);
		expect(pose.position.z).toBeCloseTo(6);
		expect(pose.lookAt!.x).toBeCloseTo(2);
		expect(pose.lookAt!.z).toBeCloseTo(0);
		expect(pose.fov).toBe(75);
	});

	it('does not move when only the subject facing changes', () => {
		const persp = new SecondPersonPerspective();
		const subject = {
			position: new Vector3(1, 0, 0),
			rotation: new Quaternion(),
		};
		const before = persp.getBasePose(context({
			anchor: { position: new Vector3(0, 0, 4) },
			primary: subject,
		}));

		subject.rotation.setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
		const after = persp.getBasePose(context({
			anchor: { position: new Vector3(0, 0, 4) },
			primary: subject,
		}));

		expect(after.position.toArray()).toEqual(before.position.toArray());
		expect(after.lookAt!.toArray()).toEqual(before.lookAt!.toArray());
	});

	it('looks along the anchor forward when there is no subject', () => {
		const pose = new SecondPersonPerspective({ eyeHeight: 2 }).getBasePose(context({
			anchor: { position: new Vector3(0, 0, 0), rotation: new Quaternion() },
		}));

		const direction = pose.lookAt!.clone().sub(pose.position).normalize();
		expect(pose.position.y).toBeCloseTo(2);
		expect(direction.z).toBeCloseTo(-1);
		expect(direction.x).toBeCloseTo(0);
	});

	it('uses the initial pose when the anchor is missing', () => {
		const pose = new SecondPersonPerspective({
			initialPosition: { x: 0, y: 2, z: 3 },
			initialLookAt: { x: 0, y: 2, z: 0 },
		}).getBasePose(context({ primary: { position: new Vector3(9, 9, 9) } }));

		expect(pose.position.z).toBeCloseTo(3);
		expect(pose.lookAt!.z).toBeCloseTo(0);
	});
});

describe('setPerspective projection swap', () => {
	it('replaces the Three.js camera when the projection kind changes', () => {
		const camera = createCamera({
			perspective: 'third-person',
			screenResolution: { x: 800, y: 600 },
		});

		expect(camera.cameraRef.camera).toBeInstanceOf(PerspectiveCamera);

		camera.setPerspective('isometric');
		expect(camera.cameraRef.camera).toBeInstanceOf(OrthographicCamera);

		camera.setPerspective('top-down');
		expect(camera.cameraRef.camera).toBeInstanceOf(OrthographicCamera);

		camera.setPerspective('second-person');
		expect(camera.cameraRef.camera).toBeInstanceOf(PerspectiveCamera);
	});
});
