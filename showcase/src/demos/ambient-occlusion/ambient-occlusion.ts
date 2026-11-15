import { Color } from 'three';
import { createCamera, createGame, createStage, gameConfig } from '@zylem/game-lib/core';
import {
	createBox,
	createCone,
	createCylinder,
	createLight,
	createPill,
	createPlane,
	createSphere,
	createText,
} from '@zylem/game-lib/entity';
import type { AmbientOcclusionMethod, AmbientOcclusionSettings } from '@zylem/game-lib/graphics';
import { demoAsset } from '../../assets/manifest';
import type { ShowcaseDemo } from '../../demo-types';

const floorTexture = demoAsset('general/texture-dirt.png');
const crateTexture = demoAsset('general/texture-wood-box.jpg');

/**
 * One stage per ambient occlusion method, with the scene and every other
 * setting identical. AO darkens the indirect light of standard materials
 * where surfaces meet, and it leaves direct light and emission alone.
 * Radius is in world units and is sized to the props, so the darkening
 * sits where each object meets the floor.
 */
const METHODS: readonly { method: AmbientOcclusionMethod; label: string }[] = [
	{ method: 'ssao', label: 'SSAO' },
	{ method: 'gtao', label: 'GTAO' },
	{ method: 'cortao', label: 'CORTAO' },
];

const sharedAmbientOcclusion = {
	quality: 'medium',
	radius: 1.6,
	intensity: 1.6,
	denoise: true,
} as const;

const solid = { static: true } as const;

type Crate = {
	name: string;
	size: number;
	x: number;
	z: number;
	y?: number;
};

function createOcclusionStage(method: AmbientOcclusionMethod, label: string) {
	const ambientOcclusion = {
		...sharedAmbientOcclusion,
		method,
	} satisfies AmbientOcclusionSettings;

	const camera = createCamera({
		position: { x: 5.4, y: 3.4, z: 6.2 },
		target: { x: -0.6, y: 0.55, z: -0.8 },
	});

	const ground = createPlane({
		name: 'ground',
		tile: { x: 14, y: 14 },
		position: { x: 0, y: 0, z: 0 },
		collision: solid,
		material: {
			path: floorTexture,
			repeat: { x: 4, y: 4 },
		},
	});

	// The built-in key light is bright enough to hide AO, which only shades
	// indirect light. A softer ambient fill lets the contact darkening read,
	// and a side key keeps the forms modeled.
	const fill = createLight({
		name: 'fill',
		type: 'ambient',
		color: '#ffffff',
		intensity: 0.9,
	});
	const key = createLight({
		name: 'key',
		type: 'directional',
		color: '#fff4e5',
		intensity: 1.15,
		position: { x: 7, y: 9, z: 5 },
		target: { x: -0.5, y: 0, z: -1 },
		castShadow: true,
		shadow: {
			mapSize: 2048,
			near: 0.5,
			far: 30,
			left: -10,
			right: 10,
			top: 10,
			bottom: -10,
		},
	});

	const plaster = new Color('#d8d2c6');
	const stone = new Color('#b7b3aa');
	const clay = new Color('#c4a48a');
	const moss = new Color('#8fa387');

	const backWall = createBox({
		name: 'back-wall',
		size: { x: 8.4, y: 2.4, z: 0.28 },
		position: { x: -0.2, y: 1.2, z: -3.5 },
		collision: solid,
		material: { color: plaster },
	});

	const sideWall = createBox({
		name: 'side-wall',
		size: { x: 0.28, y: 2.4, z: 6.6 },
		position: { x: -4.2, y: 1.2, z: -0.4 },
		collision: solid,
		material: { color: plaster },
	});

	const column = createCylinder({
		name: 'column',
		radiusTop: 0.38,
		radiusBottom: 0.42,
		height: 2.5,
		position: { x: -3.55, y: 1.25, z: -2.85 },
		collision: solid,
		material: { color: stone },
	});

	const crates: Crate[] = [
		{ name: 'crate-left', size: 1.15, x: -1.7, z: -2.35 },
		{ name: 'crate-right', size: 1.15, x: -0.45, z: -2.28 },
		{ name: 'crate-top', size: 0.95, x: -1.08, z: -2.3, y: 1.15 + 0.475 },
	];

	const crateEntities = crates.map((crate) =>
		createBox({
			name: crate.name,
			size: { x: crate.size, y: crate.size, z: crate.size },
			position: { x: crate.x, y: crate.y ?? crate.size / 2, z: crate.z },
			collision: solid,
			material: { path: crateTexture },
		}),
	);

	const step = createBox({
		name: 'step',
		size: { x: 3.4, y: 0.32, z: 2.1 },
		position: { x: -1.15, y: 0.16, z: 0.55 },
		collision: solid,
		material: { color: stone },
	});

	const stepCrate = createBox({
		name: 'step-crate',
		size: { x: 0.7, y: 0.7, z: 0.7 },
		position: { x: -1.7, y: 0.67, z: 0.35 },
		collision: solid,
		material: { path: crateTexture },
	});

	const urn = createSphere({
		name: 'urn',
		radius: 0.62,
		position: { x: 1.85, y: 0.62, z: 0.15 },
		collision: solid,
		material: { color: clay },
	});

	const bollard = createCylinder({
		name: 'bollard',
		radiusTop: 0.28,
		radiusBottom: 0.32,
		height: 1.15,
		position: { x: 2.7, y: 0.575, z: -1.55 },
		collision: solid,
		material: { color: stone },
	});

	const marker = createCone({
		name: 'marker',
		radius: 0.55,
		height: 1.35,
		position: { x: 0.35, y: 0.675, z: 1.7 },
		collision: solid,
		material: { color: moss },
	});

	const post = createPill({
		name: 'post',
		radius: 0.22,
		length: 1.1,
		position: { x: -2.55, y: 0.77, z: 1.35 },
		collision: solid,
		material: { color: plaster },
	});

	const pebbles = [
		{ x: 3.1, z: 1.4, radius: 0.28 },
		{ x: 3.55, z: 1.05, radius: 0.18 },
		{ x: 2.85, z: 1.85, radius: 0.16 },
		{ x: -3.15, z: 1.9, radius: 0.34 },
		{ x: 0.9, z: -1.15, radius: 0.22 },
	].map((pebble, index) =>
		createSphere({
			name: `pebble-${index}`,
			radius: pebble.radius,
			position: { x: pebble.x, y: pebble.radius, z: pebble.z },
			collision: solid,
			material: { color: stone },
		}),
	);

	const caption = createText({
		name: 'caption',
		text: `${label}  ·  medium  ·  radius 1.6    ·    Z next  ·  X back`,
		fontSize: 16,
		fontColor: '#f4f1ea',
		backgroundColor: '#1c2430',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.06 },
	});

	return createStage(
		{
			backgroundColor: new Color('#8ea4bb'),
			gravity: { x: 0, y: 0, z: 0 },
			defaultLighting: false,
			ambientOcclusion,
		},
		camera,
		fill,
		key,
		ground,
		backWall,
		sideWall,
		column,
		...crateEntities,
		step,
		stepCrate,
		urn,
		bollard,
		marker,
		post,
		...pebbles,
		caption,
	);
}

export default function createDemo(): ShowcaseDemo {
	let stageIndex = 0;
	const lastStage = METHODS.length - 1;

	const game = createGame(
		gameConfig({
			id: 'ambient-occlusion',
			debug: true,
			bodyBackground: '#10141b',
		}),
		...METHODS.map(({ method, label }) => createOcclusionStage(method, label)),
	).onUpdate(({ inputs }) => {
		const { p1 } = inputs;
		// Z is gamepad A, X is gamepad B. Stop at the ends: nextStage and
		// previousStage log an error when there is no stage to move to.
		if (p1.buttons.A.pressed && stageIndex < lastStage) {
			stageIndex += 1;
			game.nextStage();
		}
		if (p1.buttons.B.pressed && stageIndex > 0) {
			stageIndex -= 1;
			game.previousStage();
		}
	});

	return {
		game,
		description:
			'The same courtyard on three stages. Only the ambient occlusion method changes: SSAO, then GTAO, then CORTAO. Quality, radius, and intensity stay the same.',
		controls: ['Z: next method', 'X: previous method'],
	};
}
