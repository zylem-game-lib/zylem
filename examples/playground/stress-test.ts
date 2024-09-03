import { Color, Vector2, Vector3 } from 'three';
import { ZylemSphere, plane, sphere } from '../../src/lib/entities';
import { game, stage } from '../../src/main';

const ground = plane({
	tile: new Vector2(2000, 2000),
	repeat: new Vector2(4, 6),
	static: true,
	shader: 'fire',
});

const stage1 = stage({
	gravity: new Vector3(0,-9.81,0),
	setup: ({ camera }) => {
		camera.move(new Vector3(0, 200, 900));
		camera.rotate(-0.55, 0, 0);
		stressTestGame.log(`total objects: ${spheres.length + 1}`);
	}
});

const spheres: ZylemSphere[] = [];
const colorKeys = Object.keys(Color.NAMES);
const totalColors = colorKeys.length - 1;
for (let k = 0; k < 5; k++) {
	for (let j = 0; j < 10; j++) {
		for (let i = 0; i < 10; i++) {
			const key = colorKeys.at(Math.floor(Math.random() * totalColors)) ?? '';
			const s = sphere({
				static: false,
				color: Color.NAMES[key],
				radius: 1 + Math.random() * 3,
				setup: ({ entity }) => {
					entity.setPosition((j * 5) - 5, i + 5 + (i * 5), 500 + k * 5);
				}
			});
			spheres.push(s);
		}
	}
}

const stressTestGame = game(
	{ debug: true },
	stage1,
	ground,
	...spheres
);
stressTestGame.start();