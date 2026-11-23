import { createCamera, createGame, createScreenShake, Perspectives } from '@zylem/game-lib/core';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import type { ShowcaseDemo } from '../../demo-types';
import { createCameraCourt, createCameraRover } from '../_shared/camera-court';

export default function createDemo(): ShowcaseDemo {
	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		perspectiveOptions: { distance: 7, height: 4, shoulderOffset: 1, fov: 64 },
		position: [1, 4.42, 12], target: [0, 0.42, 5], skipDebugOrbit: true,
	});
	const stage = createCameraCourt(camera);
	const rover = createCameraRover();
	stage.add(rover.entity);
	rover.entity.onSetup(({ me }) => camera.addTarget(me));
	stage.setInputConfiguration(useArrowsForAxes('p1'));
	const game = createGame({ id: 'third-person', debug: false }, stage).onUpdate(({ inputs, delta }) => {
		rover.move(inputs.p1.axes.Horizontal.value, inputs.p1.axes.Vertical.value, delta);
		if (inputs.p1.buttons.A.pressed) camera.addAction(createScreenShake({ amplitude: 0.65 }));
	});
	return {
		game,
		description: 'The camera follows the rover from behind. A short shake plays over the follow view and expires on its own.',
		controls: ['Arrows: drive the rover', 'Z: shake the camera'],
	};
}
