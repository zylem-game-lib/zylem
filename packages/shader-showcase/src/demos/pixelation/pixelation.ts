/**
 * Pixelation — Kody King's node-based pixelation pass (from the three.js
 * `webgpu_postprocessing_pixel` example) with normal/depth edge outlines,
 * registered as the first (pass-replacing) effect in game-lib's chain.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createLight, createSphere } from '@zylem/game-lib/entity';
import { createPixelationEffect } from '@zylem/shaders/postprocessing';
import { Color, IcosahedronGeometry, Mesh } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const pixels = createPixelationEffect();
	const u = pixels.uniforms;

	const ground = createBox({
		size: { x: 22, y: 0.5, z: 22 },
		position: { x: 0, y: -3.25, z: 0 },
		material: { color: new Color('#3d4761') },
	});

	const boxA = createBox({
		size: { x: 3.4, y: 3.4, z: 3.4 },
		position: { x: -4.5, y: -1.3, z: 1.5 },
		material: { color: new Color('#c2731f') },
	});
	const boxB = createBox({
		size: { x: 4.4, y: 4.4, z: 4.4 },
		position: { x: 4.5, y: -0.8, z: -1.5 },
		material: { color: new Color('#7a4dbe') },
	});
	let rotA = 30;
	let rotB = -15;
	boxA.onUpdate(({ me, delta }) => {
		rotA += delta * 10;
		me.setRotationDegreesY(rotA);
	});
	boxB.onUpdate(({ me, delta }) => {
		rotB += delta * -7;
		me.setRotationDegreesY(rotB);
	});

	// Bobbing crystal: swap in a faceted icosahedron so the flat normals
	// produce crisp pixel-outline edges.
	const crystal = createSphere({
		radius: 1.6,
		position: { x: 0, y: 1.5, z: 0 },
		material: { color: new Color('#68b7e9') },
	});
	const faceted = new IcosahedronGeometry(1.6);
	crystal.onSetup(({ me }: any) => {
		const target = me.mesh ?? me.group;
		target?.traverse?.((child: unknown) => {
			if (child instanceof Mesh) {
				child.geometry = faceted;
				child.frustumCulled = false;
			}
		});
		if (target instanceof Mesh) {
			target.geometry = faceted;
			target.frustumCulled = false;
		}
	});
	let elapsed = 0;
	crystal.onUpdate(({ me, delta }) => {
		elapsed += delta;
		me.setPosition(0, 1.5 + Math.sin(elapsed * 2) * 0.6, 0);
		me.setRotationDegreesY(elapsed * 40);
	});

	const ambient = createLight({ type: 'ambient', intensity: 1.2 });
	const sun = createLight({
		type: 'directional',
		intensity: 2.2,
		position: { x: 12, y: 16, z: -10 },
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 6, z: -16 },
		target: { x: 0, y: -0.5, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#151729',
			postProcessingEffects: [pixels.effect],
		},
		camera,
	);
	stage.add(ground);
	stage.add(boxA);
	stage.add(boxB);
	stage.add(crystal);
	stage.add(ambient);
	stage.add(sun);

	const game = createGame(
		{
			id: 'shader-showcase-pixelation',
		},
		stage,
	);

	return {
		game,
		description:
			"Kody King's pixelation pass from the three.js webgpu_postprocessing_pixel example: the scene renders at a reduced pixel grid with optional single-pixel outlines driven by normal and depth discontinuities.",
		controls: [
			rangeControl('Pixel size', u.pixelSize, 1, 16, 1),
			rangeControl('Normal edge strength', u.normalEdgeStrength, 0, 2, 0.05),
			rangeControl('Depth edge strength', u.depthEdgeStrength, 0, 1, 0.05),
		],
	};
}
