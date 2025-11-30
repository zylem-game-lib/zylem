/// <reference types="@zylem/assets" />

// TODO: need to use instancing for entities to improve performance
// TODO: need to create a material map for reused materials

import { Color, Vector2, Vector3 } from 'three';
import { createGame, createStage, box, sphere, camera } from '@zylem/game-lib';
import { plane } from '@zylem/game-lib';

import rainManPath from '@zylem/assets/2d/rain-man.png';
import grassNormalPath from '@zylem/assets/3d/textures/grass-normal.png';
import skybox from '@zylem/assets/3d/skybox/default.png';

const rainMan = rainManPath;
const grassNormal = grassNormalPath;

const testBox = await box(
	{ position: new Vector3(2, 3, 5), material: { path: rainMan } },
	await box({ position: new Vector3(1, 1, 1), material: { path: rainMan } })
);
const testBox1 = await box({ position: new Vector3(0, 5, 5), material: { path: rainMan } });
const testBox2 = await box({ position: new Vector3(4, 5, 5), material: { path: rainMan } });

let testBoxes: any[] = [];

for (let i = 0; i < 20; i++) {
	for (let j = 0; j < 5; j++) {
		const nextBox = await box({
			size: new Vector3(1 + Math.random() * 1, 1 + Math.random() * 1, 1 + Math.random() * 1),
			position: new Vector3(i - 10, j + 2, 5),
			material: { shader: 'star' },
			custom: {
				superProp: 1
			}
		});
		testBoxes.push(nextBox);
		const nextBox2 = await sphere({
			radius: 0.25 + Math.random() * 0.5,
			position: new Vector3(i - 10, 10 + j, 3),
			material: { shader: 'fire' }
		});
		testBoxes.push(nextBox2);
	}
}

const testground = await plane({
	collision: {
		static: true,
	},
	tile: new Vector2(400, 400),
	position: new Vector3(-10, -1, 0),
	material: { path: grassNormal, repeat: new Vector2(50, 50) },
});

const testSphere = await sphere({
	position: new Vector3(0, 3, 10),
	material: {
		shader: 'star'
	}
})

const spheres: any[] = [];
const colorKeys = Object.keys(Color.NAMES);
const totalColors = colorKeys.length - 1;
for (let k = 0; k < 6; k++) {
	for (let j = 0; j < 6; j++) {
		for (let i = 0; i < 6; i++) {
			const useShader = Math.random() < 0.2;
			const key = colorKeys.at(Math.floor(Math.random() * totalColors)) ?? '';
			const s = await sphere({
				collision: { static: false },
				material: {
					color: useShader ? undefined : new Color(Color.NAMES[key as keyof typeof Color.NAMES]),
					shader: useShader ? 'star' : 'standard'
				},
				radius: 0.2 + Math.random() * 1.5,
				position: { x: (j * 2) - 2, y: i + 2 + (i * 2), z: 10 + k * 2 },
			});
			spheres.push(s);
		}
	}
}


const example = createGame(
	{ id: 'stress-test', debug: true },
	createStage(
		{ gravity: new Vector3(0, -9.81, 0), backgroundImage: skybox },
		camera({
			position: new Vector3(0, 10, 25),
		})
	),
	...testBoxes,
	testBox,
	testBox1,
	testBox2,
	testSphere,
	testground,
	...spheres
);

console.log('Total objects: ' + (testBoxes.length + spheres.length + 5));

export default example;
