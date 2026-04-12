import {
	AmbientLight,
	Color,
	DirectionalLight,
	HemisphereLight,
	Vector3,
} from 'three';
import {
	createActor,
	createCamera,
	createGame,
	createStage,
} from '@zylem/game-lib';

import cougarShipGlb from '../assets/cougar-ship.glb';
import fisherShipGlb from '../assets/fisher-ship.glb';
import snakeShipGlb from '../assets/snake-ship.glb';
import vultureShipGlb from '../assets/vulture-ship.glb';

type DisplayShipConfig = {
	name: string;
	model: string;
	position: { x: number; y: number; z: number };
	scale: number;
	spinSpeed: number;
};

function orientDisplayShip(ship: ReturnType<typeof createActor>) {
	const modelRoot = ship.group?.children[0];
	if (!modelRoot) {
		return;
	}

	modelRoot.rotation.set(-Math.PI / 2, 0, Math.PI);
}

function createDisplayShip({
	name,
	model,
	position,
	scale,
	spinSpeed,
}: DisplayShipConfig) {
	const ship = createActor({
		name,
		models: [model],
		position,
		scale: { x: scale, y: scale, z: scale },
		collisionShape: 'bounds',
		collision: {
			static: true,
			sensor: true,
			size: { x: 1.4, y: 1.2, z: 1.4 },
			position: { x: 0, y: 0, z: 0 },
		},
	});

	ship.onSetup(({ me }) => {
		me.setRotation(0, 0, 0);
		orientDisplayShip(me);
	});

	ship.listen('entity:model:loaded', () => {
		orientDisplayShip(ship);
	});

	ship.onUpdate(({ me, delta }) => {
		me.rotateZ(spinSpeed * delta);
	});

	return ship;
}

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 2.5, z: 18 },
		target: { x: 0, y: 0.5, z: 0 },
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, 0, 0),
			backgroundColor: new Color('#07111d'),
		},
		camera,
	);

	stage.onSetup(({ stage: activeStage }: any) => {
		const scene = activeStage?.wrappedStage?.scene?.scene;
		if (!scene) {
			return;
		}

		if (!scene.getObjectByName('optimized-ships-ambient')) {
			const ambient = new AmbientLight('#f8fafc', 1.75);
			ambient.name = 'optimized-ships-ambient';
			scene.add(ambient);
		}

		if (!scene.getObjectByName('optimized-ships-hemi')) {
			const hemi = new HemisphereLight('#dbeafe', '#0f172a', 1.6);
			hemi.name = 'optimized-ships-hemi';
			hemi.position.set(0, 8, 10);
			scene.add(hemi);
		}

		if (!scene.getObjectByName('optimized-ships-key')) {
			const key = new DirectionalLight('#ffffff', 2.2);
			key.name = 'optimized-ships-key';
			key.position.set(8, 10, 12);
			scene.add(key);
		}

		if (!scene.getObjectByName('optimized-ships-rim')) {
			const rim = new DirectionalLight('#7dd3fc', 1.8);
			rim.name = 'optimized-ships-rim';
			rim.position.set(-10, 4, 14);
			scene.add(rim);
		}
	});

	const ships = [
		createDisplayShip({
			name: 'optimized-fisher-ship',
			model: fisherShipGlb,
			position: { x: -6.6, y: 1.1, z: 0 },
			scale: 1.4,
			spinSpeed: 0.16,
		}),
		createDisplayShip({
			name: 'optimized-snake-ship',
			model: snakeShipGlb,
			position: { x: -2.2, y: 0.3, z: 0 },
			scale: 1.2,
			spinSpeed: 0.22,
		}),
		createDisplayShip({
			name: 'optimized-vulture-ship',
			model: vultureShipGlb,
			position: { x: 2.2, y: 0.3, z: 0 },
			scale: 1.2,
			spinSpeed: -0.2,
		}),
		createDisplayShip({
			name: 'optimized-cougar-ship',
			model: cougarShipGlb,
			position: { x: 6.6, y: 1.1, z: 0 },
			scale: 1.35,
			spinSpeed: -0.15,
		}),
	];

	stage.add(...ships);

	return createGame(
		{
			id: 'optimized-ships',
			debug: true,
		},
		stage,
	);
}
