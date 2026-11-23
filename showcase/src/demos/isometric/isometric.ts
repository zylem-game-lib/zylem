import { createCamera, createGame, createStrategyPan, Perspectives } from '@zylem/game-lib/core';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import type { ShowcaseDemo } from '../../demo-types';
import { createCameraCourt } from '../_shared/camera-court';

export default function createDemo(): ShowcaseDemo {
	const camera = createCamera({
		perspective: Perspectives.Isometric, position: [14, 14, 14], target: [0, 0, 0],
		zoom: 19, skipDebugOrbit: true,
	});
	const stage = createCameraCourt(camera);
	stage.setInputConfiguration(useArrowsForAxes('p1'));
	const pan = { x: 0, y: 0 };
	const scroller = createStrategyPan({ panSpeed: 6, sampleInput: () => ({ pan }) });
	camera.useBehavior('scroller', scroller);
	const game = createGame({ id: 'isometric', debug: false }, stage).onUpdate(({ inputs }) => {
		const { axes, buttons } = inputs.p1;
		const right = axes.Horizontal.value;
		const down = axes.Vertical.value;
		// The view's horizontal axes are rotated 45 degrees from the world grid.
		pan.x = (right + down) * Math.SQRT1_2;
		pan.y = (right - down) * Math.SQRT1_2;
		if (buttons.A.pressed) {
			camera.unuseBehavior('scroller');
			camera.useBehavior('scroller', scroller);
		}
	});
	return {
		game,
		description: 'An isometric view keeps building edges parallel while a strategy scroller moves along the court.',
		controls: ['Arrows: scroll', 'Z: recenter'],
	};
}
