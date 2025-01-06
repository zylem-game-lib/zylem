import { Vector2, Vector3 } from 'three';
import { game, stage, box, sphere } from '../../src/main';

const rainPath = 'playground/rain-man.png';
const grassPath = 'playground/grass.jpg';
const grassNormalPath = 'playground/grass-normal.png';
const woodPath = 'playground/wood-box.jpg';

const testBox = await box(
	{ position: new Vector3(2, 3, 5), material: { path: rainPath } },
	await box({ position: new Vector3(1, 1, 1), material: { path: rainPath } })
);
const testBox1 = await box({ position: new Vector3(0, 5, 5), material: { path: rainPath } });
const testBox2 = await box({ position: new Vector3(4, 5, 5), material: { path: rainPath } });

let testBoxes: any[] = [];

for (let i = 0; i < 20; i++) {
	for (let j = 0; j < 10; j++) {
		const nextBox = await box({
			position: new Vector3(i - 10, j + 2, 5),
			material: { path: grassPath },
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

const testground = await box({
	collision: {
		static: true,
	},
	size: new Vector3(200, 0.5, 200),
	position: new Vector3(0, -1, 0),
	material: { path: grassNormalPath, repeat: new Vector2(100, 100) },
});

const testSphere = await sphere({
	position: new Vector3(0, 3, 10),
	material: {
		shader: 'star'
	}
})

const example = game(
	{ debug: true },
	stage(
		{ gravity: new Vector3(0, -9, 0) },
	),
	...testBoxes,
	testBox,
	testBox1,
	testBox2,
	testSphere,
	testground
);

console.log('Total objects: ' + (testBoxes.length + 4));

example.start();
