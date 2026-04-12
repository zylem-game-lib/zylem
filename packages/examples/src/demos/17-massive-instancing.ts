/// <reference types="@zylem/assets" />
import { Color, Vector3 } from 'three';
import { createBox, createCamera, createGame, createPlane, createStage } from '@zylem/game-lib';

import skybox from '@zylem/assets/3d/skybox/default.png';
import { createBundledZylemRuntimeStageAdapter } from '../runtime/zylem-runtime';

const COUNT = 2500;
const SPREAD = 30;
const HEIGHT = 30;
const HALF_EXTENT = 0.35;
const FLOOR_SIZE = 40;

export default function createDemo() {
	const stage = createStage(
		{
			gravity: new Vector3(0, -9.81, 0),
			backgroundImage: skybox,
			runtimeAdapter: createBundledZylemRuntimeStageAdapter(),
		},
		createCamera({ position: { x: 0, y: 18, z: 28 } }),
	);
	const ground = createPlane({
		tile: { x: FLOOR_SIZE, y: FLOOR_SIZE },
		size: { x: FLOOR_SIZE, y: FLOOR_SIZE, z: 1 },
		position: { x: 0, y: 0, z: 0 },
		color: new Color(0xee8855),
		runtime: {
			simulation: 'runtime',
			body: 'static',
		},
	});
	const color = new Color(0x3388ff);
	const entities = [ground];

	for (let i = 0; i < COUNT; i++) {
		const x = (Math.random() - 0.5) * SPREAD;
		const y = 5 + Math.random() * HEIGHT;
		const z = (Math.random() - 0.5) * SPREAD;

		const box = createBox({
			position: { x, y, z },
			size: { x: HALF_EXTENT * 2, y: HALF_EXTENT * 2, z: HALF_EXTENT * 2 },
			material: { color },
			name: `runtime-box-${i}`,
			runtime: {
				simulation: 'runtime',
				render: 'instanced',
				body: 'dynamic',
				colorMode: 'base',
			},
		});
		entities.push(box);
	}

	return createGame({ id: 'massive-instancing', debug: true }, stage, ...entities);
}
