import { createCamera, createGame, Perspectives } from '@zylem/game-lib/core';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import type { ShowcaseDemo } from '../../demo-types';
import { cameraBlock, createCameraCourt, createCameraRover } from '../_shared/camera-court';

export default function createDemo(): ShowcaseDemo {
	const camera = createCamera({
		perspective: Perspectives.SecondPerson, perspectiveOptions: { eyeHeight: 0.7, fov: 62 },
		position: [-6, 3.9, 8], target: [0, 0.42, 5], skipDebugOrbit: true,
	});
	const stage = createCameraCourt(camera);
	const rover = createCameraRover();
	const observer = cameraBlock('Patrolling observer', [-6, 3.2, 8], [0.45, 0.4, 0.45], 0x7ac4b7);
	stage.add(rover.entity, observer);
	observer.onSetup(() => {
		camera.addTarget(rover.entity);
		camera.addTarget(observer);
	});
	stage.setInputConfiguration(useArrowsForAxes('p1'));
	let elapsed = 0;
	const game = createGame({ id: 'second-person', debug: false }, stage).onUpdate(({ inputs, delta }) => {
		elapsed += delta;
		observer.setPosition(-6 * Math.cos(elapsed * 0.55), 3.2, 8);
		rover.move(inputs.p1.axes.Horizontal.value, inputs.p1.axes.Vertical.value, delta);
	});
	return {
		game,
		description: 'The camera rides a separate observer that patrols the south side and watches your rover.',
		controls: ['Arrows: drive the rover'],
	};
}
