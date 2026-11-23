import { Color, MathUtils, Vector3 } from 'three';
import { createStage, type CameraWrapper } from '@zylem/game-lib/core';
import { createBox, createCylinder } from '@zylem/game-lib/entity';

const UP = new Vector3(0, 1, 0);
const ROVER_HEIGHT = 0.42;

export function cameraBlock(
	name: string,
	[x, y, z]: [number, number, number],
	[width, height, depth]: [number, number, number],
	color: number,
) {
	return createBox({
		name,
		position: { x, y, z },
		size: { x: width, y: height, z: depth },
		color: new Color(color),
		collision: { static: true },
	});
}

/** A common landmark layout lets each camera show the same distances and angles. */
export function createCameraCourt(camera: CameraWrapper) {
	const stage = createStage({
		backgroundColor: new Color(0x17272f),
		gravity: { x: 0, y: 0, z: 0 },
	}, camera);
	stage.add(
		cameraBlock('Court', [0, -0.3, 0], [23, 0.6, 23], 0x425563),
		cameraBlock('North walk', [0, 0.02, -3.4], [21, 0.04, 2.3], 0x566e77),
		cameraBlock('South walk', [0, 0.02, 3.4], [21, 0.04, 2.3], 0x566e77),
		cameraBlock('Crossing', [0, 0.025, 0], [2.3, 0.05, 12], 0x627c83),
		cameraBlock('West rail', [-11.2, 0.15, 0], [0.3, 0.3, 23], 0x273a47),
		cameraBlock('East rail', [11.2, 0.15, 0], [0.3, 0.3, 23], 0x273a47),
		cameraBlock('North rail', [0, 0.15, -11.2], [23, 0.3, 0.3], 0x273a47),
		cameraBlock('South rail', [0, 0.15, 11.2], [23, 0.3, 0.3], 0x273a47),
	);
	for (const [index, x] of [-7, 0, 7].entries()) {
		stage.add(
			cameraBlock(`North tower ${index + 1}`, [x, 1.35, -7.7], [2.2, 2.7, 1.8], 0x2d414e),
			cameraBlock(`North tower cap ${index + 1}`, [x, 2.85, -7.7], [2.5, 0.3, 2.1], 0xe3a550),
		);
	}
	for (const [index, z] of [-2, 2, 6].entries()) {
		stage.add(
			cameraBlock(`West step ${index + 1}`, [-8.4, 0.3 + index * 0.3, z], [2.8, 0.6 + index * 0.6, 2.5], 0x5f7784),
			cameraBlock(`East marker ${index + 1}`, [8.4, 0.7, z], [0.7, 1.4, 0.7], 0x7ac4b7),
		);
	}
	return stage;
}

/** A player marker whose movement is shared by the three walking views. */
export function createCameraRover() {
	const position = new Vector3(0, ROVER_HEIGHT, 5);
	const movement = new Vector3();
	const entity = createCylinder({
		name: 'Rover',
		position: position.clone(),
		radiusTop: 0.38,
		radiusBottom: 0.58,
		height: 0.84,
		radialSegments: 12,
		color: new Color(0xffbf57),
		collision: { static: true },
	});
	return {
		entity,
		move(x: number, z: number, dt: number, yaw = 0) {
			if (!x && !z) return;
			movement.set(x, 0, z).clampLength(0, 1).applyAxisAngle(UP, yaw);
			position.addScaledVector(movement, dt * 5);
			position.x = MathUtils.clamp(position.x, -6, 6);
			position.z = MathUtils.clamp(position.z, -6, 6);
			entity.setPosition(position.x, position.y, position.z);
		},
	};
}
