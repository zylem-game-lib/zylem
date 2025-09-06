/// <reference types="@zylem/assets" />

// TODO: need to use instancing for entities to improve performance
// TODO: need to create a material map for reused materials

import { Color, Vector2, Vector3 } from 'three';
import { game, stage, box, sphere, camera } from '../src/main';
import { plane, ZylemSphere } from '../src/lib/entities';

import rainManPath from '@zylem/assets/2d/rain-man.png';
import grassNormalPath from '@zylem/assets/3d/textures/grass-normal.png';

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
			position: new Vector3(i - 10, j + 2, 5),
			material: { shader: 'star' },
			custom: {
				superProp: 1
			}
		});
		testBoxes.push(nextBox);
		const nextBox2 = await sphere({
			radius: 0.5,
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
	tile: new Vector2(300, 300),
	position: new Vector3(-10, -1, 0),
	material: { path: grassNormal, repeat: new Vector2(50, 50) },
});

const testSphere = await sphere({
	position: new Vector3(0, 3, 10),
	material: {
		shader: 'star'
	}
})

const spheres: ZylemSphere[] = [];
const colorKeys = Object.keys(Color.NAMES);
const totalColors = colorKeys.length - 1;
for (let k = 0; k < 5; k++) {
	for (let j = 0; j < 5; j++) {
		for (let i = 0; i < 5; i++) {
			const key = colorKeys.at(Math.floor(Math.random() * totalColors)) ?? '';
			const s = await sphere({
				collision: { static: false },
				material: { color: Color.NAMES[key] },
				radius: 0.5 + Math.random() * 3,
				position: { x: (j * 5) - 5, y: i + 5 + (i * 5), z: 10 + k * 5 },
			});
			spheres.push(s);
		}
	}
}


const example = game(
	{ id: 'stress-test', debug: true },
	stage(
		{ gravity: new Vector3(0, -9.81, 0) },
		camera({
			position: new Vector3(0, 25, 40),
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

example.start();
