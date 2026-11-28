import { SimpleOrbit } from '@zylem/game-lib/behavior';
import { createCamera, createGame, createStage } from '@zylem/game-lib/core';
import { createBox, createPlane, createSphere } from '@zylem/game-lib/entity';
import { Color } from 'three';
import { checker, color, mix, uv } from 'three/tsl';
import type { ShowcaseDemo } from '../../demo-types';

export default function createDemo(): ShowcaseDemo {
	const fixed = { static: true };
	const camera = createCamera({
		position: { x: 0, y: 2.7, z: 6 },
		target: { x: 0, y: 1.2, z: 0 },
		useOrbitalControls: true,
	});
	const mirror = createSphere({
		name: 'Mirror', radius: 1.2, position: { x: -1.5, y: 1.4, z: 0 },
		material: { environment: 'reflection' }, collision: fixed,
	});
	const bubble = createSphere({
		name: 'Bubble', radius: 1.2, position: { x: 1.5, y: 1.4, z: 0 },
		material: { environment: { type: 'bubble', resolution: 256 } }, collision: fixed,
	});
	const floor = createPlane({
		tile: { x: 15, y: 12 }, position: { x: 0, y: 0, z: -2 }, collision: fixed,
		material: { shader: { colorNode: mix(color('#30475a'), color('#9eb2ae'), checker(uv().mul(8))) } },
	});
	const columns = ['#d88958', '#1d807b', '#efe1a9', '#336a9b', '#ad4a61'].map((tint, index) =>
		createBox({
			size: { x: 0.75, y: 4, z: 0.75 }, position: { x: (index - 2) * 1.8, y: 2, z: -4.5 },
			color: new Color(tint), collision: fixed,
		}),
	);
	const marker = createSphere({
		name: 'Orbiting marker', radius: 0.45, color: new Color('#ff5537'), collision: fixed,
		position: { x: 3.6, y: 1.5, z: 0 },
	});
	marker.use(SimpleOrbit, {
		center: { x: 0, y: 1.5, z: 0 },
		radius: { x: 3.6, z: 3.1 },
		angularSpeed: 0.7,
	});
	const stage = createStage({
		background: { type: 'gradient', top: '#497a9d', horizon: '#ffe5bf', bottom: '#77758a' },
		gravity: { x: 0, y: 0, z: 0 },
	}, camera, floor, ...columns, mirror, bubble, marker);
	return {
		game: createGame({ id: 'reflection-and-bubble' }, stage),
		description: 'The left sphere mirrors the orbiting marker. The bubble on the right refracts the columns and reflects the scene around its rim.',
		controls: ['Drag: orbit', 'Scroll: zoom'],
	};
}
