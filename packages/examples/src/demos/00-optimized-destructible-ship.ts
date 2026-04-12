import {
	AmbientLight,
	Color,
	DirectionalLight,
	HemisphereLight,
	Vector3,
} from 'three';
import {
	createActor,
	createBox,
	createCamera,
	createGame,
	createStage,
	createText,
	Destructible3DBehavior,
	FractureOptions,
	type Destructible3DHandle,
} from '@zylem/game-lib';

import fisherShipGlb from '../assets/fisher-ship.glb';
import { destructiblePrebakeWorkerUrl } from './lib/destructible-prebake-worker-url';

type ShipLaneConfig = {
	id: string;
	label: string;
	mode: 'compound' | 'independent';
	position: { x: number; y: number; z: number };
	accent: string;
	seed: number;
	spinSpeed: number;
};

type ShipLaneRuntime = {
	actor: ReturnType<typeof createActor>;
	handle: Destructible3DHandle;
	statusLabel: ReturnType<typeof createText>;
	ready: boolean;
	readyText: string;
};

type ShipLaneResult = {
	entities: readonly [
		ReturnType<typeof createText>,
		ReturnType<typeof createText>,
		ReturnType<typeof createActor>,
	];
	runtime: ShipLaneRuntime;
};

const READY_DELAY_SECONDS = 1.25;
const FRACTURED_DELAY_SECONDS = 3.75;

function orientDisplayShip(ship: ReturnType<typeof createActor>) {
	const modelRoot = ship.group?.children[0];
	if (!modelRoot) {
		return;
	}

	modelRoot.rotation.set(-Math.PI / 2, 0, Math.PI);
}

function createWorldLabel(
	name: string,
	text: string,
	position: { x: number; y: number; z: number },
	backgroundColor: string,
) {
	return createText({
		name,
		text,
		fontSize: 22,
		fontColor: '#f8fafc',
		backgroundColor,
		padding: 8,
		stickToViewport: false,
		position,
	});
}

function createStatusLabel(
	name: string,
	position: { x: number; y: number; z: number },
	fontColor: string,
) {
	return createText({
		name,
		text: 'loading',
		fontSize: 18,
		fontColor,
		backgroundColor: '#08111c',
		padding: 6,
		stickToViewport: false,
		position,
	});
}

function formatLoadError(errorMessage?: string): string {
	if (!errorMessage) {
		return 'load failed';
	}

	const normalized = errorMessage
		.replace(/^Error:\s*/i, '')
		.replace(/^THREE\.GLTFLoader:\s*/i, '')
		.replace(/\s+/g, ' ')
		.trim();

	if (normalized.length <= 42) {
		return normalized;
	}

	return `${normalized.slice(0, 39)}...`;
}

function formatMeshCount(meshCount?: number): string {
	const count = meshCount ?? 0;
	return `${count} mesh${count === 1 ? '' : 'es'}`;
}

function createShipLane(config: ShipLaneConfig): ShipLaneResult {
	const titleLabel = createWorldLabel(
		`${config.id}-title`,
		config.label,
		{ x: config.position.x, y: 4.15, z: config.position.z },
		'#09131d',
	);
	const statusLabel = createStatusLabel(
		`${config.id}-status`,
		{ x: config.position.x, y: -0.15, z: config.position.z },
		config.accent,
	);
	const actor = createActor({
		name: `${config.id}-ship`,
		models: [fisherShipGlb],
		position: config.position,
		scale: { x: 1.18, y: 1.18, z: 1.18 },
	});
	const handle = actor.use(Destructible3DBehavior, {
		fractureOptions: new FractureOptions({
			fractureMethod: 'voronoi',
			fragmentCount: config.mode === 'independent' ? 10 : 8,
			voronoiOptions: {
				mode: '3D',
			},
			seed: config.seed,
		}),
		prebakeWorkerUrl: destructiblePrebakeWorkerUrl,
		collider: {
			shape: 'cuboid',
		},
		fragmentPhysics: config.mode === 'independent'
			? {
				mode: 'independent',
				inheritSourceVelocity: false,
				outwardVelocity: 4.2,
				angularVelocity: 1.8,
			}
			: {
				mode: 'compound',
			},
	});

	const runtime: ShipLaneRuntime = {
		actor,
		handle,
		statusLabel,
		ready: false,
		readyText: 'loading',
	};

	actor.onSetup(({ me }) => {
		me.setRotation(0, 0, 0);
		orientDisplayShip(me);
		statusLabel.updateText('loading');
	});

	actor.listen('entity:model:loaded', ({ success, meshCount, errorMessage }) => {
		orientDisplayShip(actor);
		if (!success) {
			statusLabel.updateText(formatLoadError(errorMessage));
			return;
		}

		void handle.prebakeAsync().then(
			() => {
				runtime.ready = true;
				runtime.readyText = `ready • ${formatMeshCount(meshCount)}`;
				statusLabel.updateText(runtime.readyText);
			},
			(error) => {
				console.warn(`Failed to warm destructible optimized ship: ${config.id}`, error);
				statusLabel.updateText('prebake failed');
			},
		);
	});

	actor.onUpdate(({ me, delta }) => {
		if (handle.isFractured()) {
			return;
		}

		me.rotateZ(config.spinSpeed * delta);
	});

	return {
		entities: [titleLabel, statusLabel, actor],
		runtime,
	};
}

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 1.8, z: 18 },
		target: { x: 0, y: 1.2, z: 0 },
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, 0, 0),
			backgroundColor: new Color('#030712'),
			assetLoaders: {
				gltf: {
					meshopt: true,
					ktx2TranscoderPath: '/three/basis/',
				},
			},
		},
		camera,
	);

	stage.setInputConfiguration({
		p1: {
			key: {
				' ': ['buttons.a'],
				z: ['buttons.b'],
				r: ['buttons.b'],
			},
		},
	});

	stage.onSetup(({ stage: activeStage }: any) => {
		const scene = activeStage?.wrappedStage?.scene?.scene;
		if (!scene) {
			return;
		}

		if (!scene.getObjectByName('optimized-destructible-ambient')) {
			const ambient = new AmbientLight('#f8fafc', 1.9);
			ambient.name = 'optimized-destructible-ambient';
			scene.add(ambient);
		}

		if (!scene.getObjectByName('optimized-destructible-hemi')) {
			const hemi = new HemisphereLight('#dbeafe', '#020617', 1.7);
			hemi.name = 'optimized-destructible-hemi';
			hemi.position.set(0, 8, 10);
			scene.add(hemi);
		}

		if (!scene.getObjectByName('optimized-destructible-key')) {
			const key = new DirectionalLight('#ffffff', 2.3);
			key.name = 'optimized-destructible-key';
			key.position.set(8, 10, 14);
			scene.add(key);
		}

		if (!scene.getObjectByName('optimized-destructible-rim')) {
			const rim = new DirectionalLight('#67e8f9', 1.9);
			rim.name = 'optimized-destructible-rim';
			rim.position.set(-10, 6, 16);
			scene.add(rim);
		}
	});

	const instructionText = createText({
		name: 'optimized-destructible-instructions',
		text: 'Optimized GLB destructible demo. Auto-cycles after prebake. Press space to fracture now, or z / r to repair.',
		fontSize: 17,
		fontColor: '#f8fafc',
		backgroundColor: '#09131d',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.08 },
	});

	const backdrop = createBox({
		name: 'optimized-destructible-backdrop',
		position: { x: 0, y: 1.3, z: -2.8 },
		size: { x: 18, y: 8.4, z: 0.35 },
		material: {
			color: new Color('#0b1724'),
			opacity: 0.9,
		},
	});
	const floor = createBox({
		name: 'optimized-destructible-floor',
		position: { x: 0, y: -1.45, z: 0 },
		size: { x: 22, y: 0.45, z: 12 },
		material: {
			color: new Color('#111c2a'),
			opacity: 0.96,
		},
	});
	const pedestals = [
		createBox({
			name: 'optimized-destructible-compound-pedestal',
			position: { x: -5.2, y: -0.45, z: 0 },
			size: { x: 4.4, y: 1.2, z: 4.4 },
			material: {
				color: new Color('#1d4ed8').multiplyScalar(0.45),
			},
		}),
		createBox({
			name: 'optimized-destructible-independent-pedestal',
			position: { x: 5.2, y: -0.45, z: 0 },
			size: { x: 4.4, y: 1.2, z: 4.4 },
			material: {
				color: new Color('#f97316').multiplyScalar(0.42),
			},
		}),
	];

	const lanes = [
		createShipLane({
			id: 'optimized-destructible-compound',
			label: 'Compound Fragments',
			mode: 'compound',
			position: { x: -5.2, y: 1.25, z: 0 },
			accent: '#93c5fd',
			seed: 17,
			spinSpeed: 0.16,
		}),
		createShipLane({
			id: 'optimized-destructible-independent',
			label: 'Independent Fragments',
			mode: 'independent',
			position: { x: 5.2, y: 1.25, z: 0 },
			accent: '#fdba74',
			seed: 31,
			spinSpeed: -0.16,
		}),
	];

	stage.add(
		backdrop,
		floor,
		...pedestals,
		...lanes.flatMap((lane) => lane.entities),
	);

	let cycleTimer = 0;

	function allReady() {
		return lanes.every((lane) => lane.runtime.ready);
	}

	function anyFractured() {
		return lanes.some((lane) => lane.runtime.handle.isFractured());
	}

	function fractureAll() {
		for (const lane of lanes) {
			if (!lane.runtime.ready || lane.runtime.handle.isFractured()) {
				continue;
			}

			try {
				lane.runtime.handle.fracture();
				lane.runtime.statusLabel.updateText('fractured');
			} catch (error) {
				console.warn(`Failed to fracture optimized ship lane: ${lane.runtime.actor.name}`, error);
				lane.runtime.statusLabel.updateText('fracture failed');
			}
		}

		cycleTimer = 0;
	}

	function repairAll() {
		for (const lane of lanes) {
			if (!lane.runtime.ready) {
				continue;
			}

			try {
				lane.runtime.handle.repair();
				lane.runtime.statusLabel.updateText(lane.runtime.readyText);
			} catch (error) {
				console.warn(`Failed to repair optimized ship lane: ${lane.runtime.actor.name}`, error);
				lane.runtime.statusLabel.updateText('repair failed');
			}
		}

		cycleTimer = 0;
	}

	return createGame(
		{
			id: 'optimized-destructible-ship',
			debug: true,
		},
		stage,
		instructionText,
	).onUpdate(({ inputs, delta }) => {
		const { p1 } = inputs;
		if (p1.buttons.A?.pressed) {
			fractureAll();
			return;
		}

		if (p1.buttons.B?.pressed) {
			repairAll();
			return;
		}

		if (!allReady()) {
			return;
		}

		cycleTimer += delta;
		if (anyFractured()) {
			if (cycleTimer >= FRACTURED_DELAY_SECONDS) {
				repairAll();
			}
			return;
		}

		if (cycleTimer >= READY_DELAY_SECONDS) {
			fractureAll();
		}
	});
}
