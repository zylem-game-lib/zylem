/**
 * Holographic — Anderson Mancini's holographic material ported to TSL:
 * screen-space scanlines, fresnel rim, and signal-blink flicker with
 * additive blending.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';
import { createHolographic } from '@zylem/shaders';
import { BoxGeometry, Mesh } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const hologram = createHolographic({ glitchIntensity: 0.6 });
	const u = hologram.uniforms;

	const sphere = createSphere({
		radius: 3,
		position: { x: -4.5, y: 0, z: 0 },
		material: { shader: hologram },
	});
	const box = createBox({
		size: { x: 4.2, y: 4.2, z: 4.2 },
		position: { x: 4.5, y: 0, z: 0 },
		material: { shader: hologram },
	});
	// Default BoxGeometry has one segment per side; swap in a segmented one
	// so the glitch bands have vertices to displace.
	const segmented = new BoxGeometry(4.2, 4.2, 4.2, 12, 12, 12);
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
	let rotation = 0;
	box.onUpdate(({ me, delta }) => {
		rotation += delta * 14;
		me.setRotationDegreesY(rotation);
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 1.5, z: -15 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#05070d',
		},
		camera,
	);
	stage.add(sphere);
	stage.add(box);

	const game = createGame(
		{
			id: 'shader-showcase-holographic',
		},
		stage,
	);

	return {
		game,
		description:
			'Holographic material ported from ektogamat/threejs-vanilla-holographic-material: screen-space scanlines with RGB jitter, a fresnel rim, and signal-blink flicker, composited additively.',
		controls: [
			rangeControl('Brightness', u.hologramBrightness, 0, 2, 0.05),
			rangeControl('Opacity', u.hologramOpacity, 0, 1, 0.02),
			rangeControl('Fresnel amount', u.fresnelAmount, 0, 1.5, 0.02),
			rangeControl('Fresnel opacity', u.fresnelOpacity, 0, 2, 0.05),
			rangeControl('Scanline size', u.scanlineSize, 1, 30, 0.5),
			rangeControl('Signal speed', u.signalSpeed, 0, 3, 0.05),
			rangeControl('Glitch intensity', u.glitchIntensity, 0, 2, 0.05),
			rangeControl('Glitch frequency', u.glitchFrequency, 0.1, 4, 0.05),
			colorControl('Hologram color', u.hologramColor),
		],
	};
}
