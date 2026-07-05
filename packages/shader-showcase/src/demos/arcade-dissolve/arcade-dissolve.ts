/**
 * Arcade Dissolve — Robotron-2084-style destruction: the mesh shreds into
 * horizontal and vertical bands that slide apart while flashing through a
 * bright arcade palette. Progress ping-pongs automatically.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';
import { createArcadeDissolve } from '@zylem/shaders';
import { BoxGeometry, Mesh } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const dissolve = createArcadeDissolve();
	const u = dissolve.uniforms;
	const animSpeed = { value: 0.35 };

	const sphere = createSphere({
		radius: 3,
		position: { x: -4.5, y: 0, z: 0 },
		material: { shader: dissolve },
	});
	const box = createBox({
		size: { x: 4.5, y: 4.5, z: 4.5 },
		position: { x: 4.5, y: 0, z: 0 },
		material: { shader: dissolve },
	});
	// Default BoxGeometry has one segment per side; swap in a segmented one
	// so the bands have vertices to slide apart.
	const segmented = new BoxGeometry(4.5, 4.5, 4.5, 12, 12, 12);
	box.onSetup(({ me }: any) => {
		const target = me.mesh ?? me.group;
		target?.traverse?.((child: unknown) => {
			if (child instanceof Mesh) {
				child.geometry = segmented;
				child.frustumCulled = false;
			}
		});
		if (target instanceof Mesh) {
			target.geometry = segmented;
			target.frustumCulled = false;
		}
	});

	// Ping-pong destruction progress with a hold at each end
	let elapsed = 0;
	sphere.onUpdate(({ delta }) => {
		elapsed += delta * animSpeed.value;
		const t = elapsed % 2.6;
		if (t < 0.3) {
			u.progress.value = 0;
		} else if (t < 1.3) {
			u.progress.value = t - 0.3;
		} else if (t < 1.6) {
			u.progress.value = 1;
		} else {
			u.progress.value = 1 - (t - 1.6);
		}
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 1.5, z: -18 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#000000',
		},
		camera,
	);
	stage.add(sphere);
	stage.add(box);

	const game = createGame(
		{
			id: 'shader-showcase-arcade-dissolve',
		},
		stage,
	);

	return {
		game,
		description:
			'Robotron-2084-style destruction: the mesh slices into horizontal and vertical bands that slide apart on staggered timers, flashing through an arcade palette before evaporating.',
		controls: [
			rangeControl('Animation speed', animSpeed, 0, 1.5, 0.01),
			rangeControl('Band frequency', u.bandFrequency, 0.5, 8, 0.1),
			rangeControl('Displacement', u.displacement, 0, 10, 0.1),
			rangeControl('Stagger', u.stagger, 0, 1, 0.02),
			rangeControl('Flash speed', u.flashSpeed, 0, 24, 0.5),
			colorControl('Base color', u.baseColor),
			colorControl('Flash color A', u.colorA),
			colorControl('Flash color B', u.colorB),
			colorControl('Flash color C', u.colorC),
		],
	};
}
