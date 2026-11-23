import { luminance, mix, vec3, vec4 } from 'three/tsl';
import { createCamera, createGame, Perspectives, type Pass } from '@zylem/game-lib/core';
import type { ShowcaseDemo } from '../../demo-types';
import { createCameraCourt, createCameraRover } from '../_shared/camera-court';

const surveyPass: Pass<{ strength: number }> = {
	options: { strength: 0.4 },
	apply(input, _context, { strength }) {
		const color = vec4(input);
		const survey = vec3(luminance(color.rgb)).mul(vec3(0.62, 0.9, 1));
		return vec4(mix(color.rgb, survey, strength), color.a);
	},
};

export default function createDemo(): ShowcaseDemo {
	const camera = createCamera({
		perspective: Perspectives.TopDown, position: [0, 16, 0], target: [0, 0, 0],
		zoom: 22, skipDebugOrbit: true,
	});
	const stage = createCameraCourt(camera);
	const rover = createCameraRover();
	stage.add(rover.entity);
	stage.setInputConfiguration({ p1: { includeDefaults: false, key: {
		ArrowLeft: ['axes.Left'], ArrowRight: ['axes.Right'],
		ArrowUp: ['axes.Up'], ArrowDown: ['axes.Down'],
		z: ['buttons.A'], x: ['buttons.B'], c: ['buttons.X'],
	} } });
	let strong = false;
	camera.addEffect('survey', surveyPass);
	const game = createGame({ id: 'top-down', debug: false }, stage).onUpdate(({ inputs, delta }) => {
		const { axes, buttons } = inputs.p1;
		rover.move(axes.Horizontal.value, axes.Vertical.value, delta);
		if (buttons.A.pressed) {
			camera.clearWaypoints();
			camera.addWaypoints(
				{ position: [-5, 16, -2], lookAt: [-5, 0, -2], duration: 1 },
				{ position: [5, 16, -2], lookAt: [5, 0, -2], duration: 1.6 },
				{ position: [0, 16, 0], lookAt: [0, 0, 0], duration: 1 },
			);
		}
		if (buttons.B.pressed) {
			strong = !strong;
			if (!camera.updateEffect('survey', { strength: strong ? 1 : 0.4 })) {
				camera.addEffect('survey', surveyPass);
				camera.updateEffect('survey', { strength: strong ? 1 : 0.4 });
			}
		}
		if (buttons.X.pressed) camera.removeEffect('survey');
	});
	return {
		game,
		description: 'Survey the court from overhead. A timed route pans across its landmarks, and a camera effect controls the tint.',
		controls: ['Arrows: drive the rover', 'Z: run the camera tour', 'X: change or restore tint', 'C: remove tint'],
	};
}
