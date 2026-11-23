import { createCamera, createGame, Perspectives, type FirstPersonPerspective } from '@zylem/game-lib/core';
import type { ShowcaseDemo } from '../../demo-types';
import { createCameraCourt, createCameraRover } from '../_shared/camera-court';

export default function createDemo(): ShowcaseDemo {
	const camera = createCamera({
		perspective: Perspectives.FirstPerson,
		perspectiveOptions: { eyeHeight: 1.35, pitchLimit: 0.65 },
		position: [0, 1.77, 5], target: [0, 1.77, -5], skipDebugOrbit: true,
	});
	const view = camera.getPerspective<FirstPersonPerspective>();
	const stage = createCameraCourt(camera);
	const rover = createCameraRover();
	stage.add(rover.entity);
	rover.entity.onSetup(({ me }) => camera.addTarget(me));
	stage.setInputConfiguration({ p1: { includeDefaults: false, key: {
		w: ['axes.Up'], a: ['axes.Left'], s: ['axes.Down'], d: ['axes.Right'],
		ArrowLeft: ['axes.SecondaryLeft'], ArrowRight: ['axes.SecondaryRight'],
		ArrowUp: ['axes.SecondaryUp'], ArrowDown: ['axes.SecondaryDown'],
	} } });
	let yaw = 0;
	const game = createGame({ id: 'first-person', debug: false }, stage).onUpdate(({ inputs, delta }) => {
		const { axes } = inputs.p1;
		const yawChange = -axes.SecondaryHorizontal.value * delta * 1.6;
		yaw += yawChange;
		view.look(yawChange, -axes.SecondaryVertical.value * delta * 1.15);
		rover.move(axes.Horizontal.value, axes.Vertical.value, delta, yaw);
	});
	return {
		game,
		description: 'Walk through the court at eye level. Movement follows the direction you turn.',
		controls: ['WASD: walk', 'Arrows: look'],
	};
}
