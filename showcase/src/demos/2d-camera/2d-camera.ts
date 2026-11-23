import { Color, Vector3 } from 'three';
import { createCamera, createGame, createPlatformFollow, createStage, Perspectives, type CameraBehavior } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { Platformer2DBehavior, type Platformer2DEntity } from '@zylem/game-lib/behavior';
import type { ShowcaseDemo } from '../../demo-types';
import { cameraBlock } from '../_shared/camera-court';

export default function createDemo(): ShowcaseDemo {
	const camera = createCamera({
		perspective: Perspectives.Fixed2D, position: [0, 2, 12], zoom: 10, skipDebugOrbit: true,
	});
	const stage = createStage({ backgroundColor: new Color(0x17272f), gravity: { x: 0, y: -20, z: 0 } }, camera);
	stage.setInputConfiguration({ p1: { includeDefaults: false, key: {
		ArrowLeft: ['axes.Left'], ArrowRight: ['axes.Right'], ' ': ['buttons.A'], z: ['buttons.B'],
	} } });
	const player = createBox({
		name: 'Runner', position: { x: -7, y: 0.8, z: 0 }, size: { x: 0.8, y: 1.1, z: 0.8 },
		color: new Color(0xffbf57),
		collision: { lockRotations: true, lockTranslations: [false, false, true] },
	});
	player.use(Platformer2DBehavior, {
		walkSpeed: 5, runSpeed: 5, jumpForce: 8.8, gravity: 20, maxJumps: 1,
		useAttachedCollider: false, shape: { halfHeight: 0.24, radius: 0.32 },
	});
	player.onSetup(({ me }) => camera.addTarget(me));
	const frame: CameraBehavior = {
		update(context, pose) {
			const target = context.targets.primary;
			if (!target) return pose;
			const lookAt = new Vector3(target.position.x + 1.8, target.position.y + 1.3, 0);
			return { ...pose, position: new Vector3(lookAt.x, lookAt.y, 12), lookAt };
		},
	};
	const settle = createPlatformFollow({ axes: { z: 'off' }, window: 0.6, lookahead: 0.4 });
	camera.useBehavior('frame', frame);
	camera.useBehavior('settle', settle);
	let softFollow = true;
	player.onUpdate(({ me, inputs }) => {
		const control = (me as typeof me & Partial<Platformer2DEntity>).$platformer2D;
		if (control) {
			control.moveX = inputs.p1.axes.Horizontal.value;
			control.jump = inputs.p1.buttons.A.held > 0;
		}
		if (inputs.p1.buttons.B.pressed) {
			softFollow = !softFollow;
			if (softFollow) camera.useBehavior('settle', settle);
			else camera.unuseBehavior('settle');
		}
	});
	stage.add(
		cameraBlock('Runway', [9, -0.6, 0], [39, 1.2, 2.4], 0x455b69),
		cameraBlock('Left wall', [-10, 1.9, 0], [1, 4, 2.4], 0x2d414e),
		cameraBlock('Right wall', [28, 1.9, 0], [1, 4, 2.4], 0x2d414e),
		player,
	);
	for (const [index, x] of [-1, 4, 9, 14, 19, 24].entries()) {
		const height = [0.6, 1.25, 1.9, 1.25, 0.7, 1.3][index]!;
		stage.add(
			cameraBlock(`Platform ${index + 1}`, [x, height - 0.2, 0], [3.4, 0.4, 1.8], 0x659c9d),
			cameraBlock(`Support ${index + 1}`, [x, height / 2 - 0.2, -0.8], [0.5, height, 0.25], 0x526975),
		);
	}
	return {
		game: createGame({ id: '2d-camera', debug: false }, stage),
		description: 'An orthographic side view follows a runner across platforms. Soft follow waits for the runner to settle vertically.',
		controls: ['Left / Right: move', 'Space: jump', 'Z: toggle soft follow'],
	};
}
