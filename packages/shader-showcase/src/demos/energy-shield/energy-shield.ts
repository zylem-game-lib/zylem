/**
 * Energy Shield — Halo-inspired shield bubble: fresnel rim, hex-cell
 * lattice with per-cell flicker, energy sweeps, a recharge wave, and
 * randomized impact flares with expanding ripples.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';
import { createEnergyShield } from '@zylem/shaders';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

const IMPACT_INTERVAL = 2.2;
const IMPACT_DURATION = 0.9;

export default function createDemo(): ShowcaseDemo {
	const shield = createEnergyShield();
	const u = shield.uniforms;

	const core = createBox({
		size: { x: 2.4, y: 1.2, z: 3.2 },
		position: { x: 0, y: 0, z: 0 },
		material: { color: new Color('#9aa3ad') },
	});
	const bubble = createSphere({
		radius: 3.2,
		position: { x: 0, y: 0, z: 0 },
		collision: { static: true, sensor: true },
		material: { shader: shield },
	});

	// Rotate the core and fire a fake "shot" at a random point on the shell
	// every couple of seconds, playing the impact flare/ripple.
	let coreRotation = 0;
	let clock = 0;
	let impactStart = -1;
	core.onUpdate(({ me, delta }) => {
		coreRotation += delta * 12;
		me.setRotationDegreesY(coreRotation);

		clock += delta;
		if (impactStart < 0 && clock >= IMPACT_INTERVAL) {
			clock = 0;
			impactStart = 0;
			const theta = Math.random() * Math.PI * 2;
			const y = Math.random() * 2 - 1;
			const s = Math.sqrt(1 - y * y);
			// Bias shots toward the camera-facing hemisphere (-z) so most
			// impacts are visible.
			const zSign = Math.random() < 0.75 ? -1 : 1;
			u.impactPoint.value.set(
				s * Math.cos(theta),
				y,
				zSign * Math.abs(s * Math.sin(theta)),
			);
			u.impactPhase.value = 0;
		}
		if (impactStart >= 0) {
			impactStart += delta;
			u.impactPhase.value = Math.min(impactStart / IMPACT_DURATION, 1);
			if (impactStart >= IMPACT_DURATION) {
				impactStart = -1;
			}
		}
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 2, z: -12 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#070a12',
		},
		camera,
	);
	stage.add(core);
	stage.add(bubble);

	const game = createGame(
		{
			id: 'shader-showcase-energy-shield',
		},
		stage,
	);

	return {
		game,
		description:
			'Halo-inspired energy shield: fresnel rim that flares at grazing angles, a hex-cell lattice with per-cell flicker, scrolling energy sweeps, an upward recharge wave, and randomized impact flares with expanding ripples.',
		controls: [
			rangeControl('Rim power', u.rimPower, 0.5, 8, 0.1),
			rangeControl('Rim intensity', u.rimIntensity, 0, 3, 0.05),
			rangeControl('Hex scale', u.hexScale, 2, 40, 1),
			rangeControl('Hex intensity', u.hexIntensity, 0, 1.5, 0.05),
			rangeControl('Flicker speed', u.flickerSpeed, 0, 10, 0.25),
			rangeControl('Wave intensity', u.ringIntensity, 0, 1, 0.02),
			rangeControl('Wave speed', u.waveSpeed, 0, 1.5, 0.05),
			rangeControl('Pulse speed', u.pulseSpeed, 0, 30, 0.5),
			rangeControl('Pulse amount', u.pulseAmount, 0, 1, 0.02),
			rangeControl('Sweep speed', u.sweepSpeed, 0, 4, 0.05),
			rangeControl('Sweep frequency', u.sweepFrequency, 0.2, 4, 0.05),
			rangeControl('Impact intensity', u.impactIntensity, 0, 4, 0.1),
			rangeControl('Max alpha', u.maxAlpha, 0, 1, 0.02),
			colorControl('Base color', u.baseColor),
			colorControl('Glow color', u.glowColor),
			colorControl('Impact color', u.impactColor),
		],
	};
}
