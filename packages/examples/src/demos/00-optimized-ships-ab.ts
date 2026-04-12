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
	createText,
} from '@zylem/game-lib';

import rawCougarShipGlb from '../../raw-assets/cougar-ship.glb';
import rawFisherShipGlb from '../../raw-assets/fisher-ship.glb';
import rawSnakeShipGlb from '../../raw-assets/snake-ship.glb';
import rawVultureShipGlb from '../../raw-assets/vulture-ship.glb';
import cougarShipGlb from '../assets/cougar-ship.glb';
import fisherShipGlb from '../assets/fisher-ship.glb';
import snakeShipGlb from '../assets/snake-ship.glb';
import vultureShipGlb from '../assets/vulture-ship.glb';

type ShipRowConfig = {
	id: string;
	label: string;
	rawModel: string;
	optimizedModel: string;
	y: number;
	scale: number;
	spinSpeed: number;
};

type DisplayShipConfig = {
	name: string;
	model: string;
	position: { x: number; y: number; z: number };
	scale: number;
	spinSpeed: number;
	statusLabel: ReturnType<typeof createText>;
};

type DemoEntity = ReturnType<typeof createActor> | ReturnType<typeof createText>;

const RAW_COLUMN_X = -6.5;
const OPTIMIZED_COLUMN_X = 6.5;

function getDebugRoot(): HTMLPreElement | null {
	if (typeof document === 'undefined') {
		return null;
	}

	let root = document.getElementById('optimized-ships-ab-debug') as HTMLPreElement | null;
	if (root) {
		return root;
	}

	root = document.createElement('pre');
	root.id = 'optimized-ships-ab-debug';
	root.style.position = 'fixed';
	root.style.left = '12px';
	root.style.bottom = '12px';
	root.style.zIndex = '9999';
	root.style.margin = '0';
	root.style.padding = '10px 12px';
	root.style.maxWidth = 'min(540px, calc(100vw - 24px))';
	root.style.maxHeight = '40vh';
	root.style.overflow = 'auto';
	root.style.whiteSpace = 'pre-wrap';
	root.style.font = '12px/1.45 Menlo, Monaco, Consolas, monospace';
	root.style.color = '#e2e8f0';
	root.style.background = 'rgba(6, 12, 24, 0.92)';
	root.style.border = '1px solid rgba(148, 163, 184, 0.3)';
	root.style.borderRadius = '8px';
	root.style.pointerEvents = 'none';
	root.textContent = 'optimized-ships-ab debug\n';
	document.body.append(root);
	return root;
}

function updateDebugStatus(name: string, value: string): void {
	const root = getDebugRoot();
	if (!root) {
		return;
	}

	const entries = new Map<string, string>();
	for (const line of root.textContent?.split('\n') ?? []) {
		const [key, ...rest] = line.split(': ');
		if (!key || rest.length === 0) {
			continue;
		}
		entries.set(key, rest.join(': '));
	}

	entries.set(name, value);
	root.textContent = [
		'optimized-ships-ab debug',
		...Array.from(entries.entries()).map(([key, entryValue]) => `${key}: ${entryValue}`),
	].join('\n');
}

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
	fontSize: number,
) {
	return createText({
		name,
		text,
		fontSize,
		fontColor: '#f8fafc',
		backgroundColor: '#09111c',
		padding: 8,
		stickToViewport: false,
		position,
	});
}

function createStatusLabel(
	name: string,
	position: { x: number; y: number; z: number },
) {
	return createText({
		name,
		text: 'waiting for model',
		fontSize: 18,
		fontColor: '#bfdbfe',
		backgroundColor: '#0b1620',
		padding: 6,
		stickToViewport: false,
		position,
	});
}

function formatLoadError(errorMessage?: string): string {
	if (!errorMessage) {
		return 'failed to load';
	}

	const normalized = errorMessage
		.replace(/^Error:\s*/i, '')
		.replace(/^THREE\.GLTFLoader:\s*/i, '')
		.replace(/\s+/g, ' ')
		.trim();

	if (normalized.length <= 44) {
		return normalized;
	}

	return `${normalized.slice(0, 41)}...`;
}

function createDisplayShip({
	name,
	model,
	position,
	scale,
	spinSpeed,
	statusLabel,
}: DisplayShipConfig) {
	const ship = createActor({
		name,
		models: [model],
		position,
		scale: { x: scale, y: scale, z: scale },
	});

	ship.onSetup(({ me }) => {
		me.setRotation(0, 0, 0);
		orientDisplayShip(me);
		statusLabel.updateText('loading');
		updateDebugStatus(name, 'loading');
	});

	ship.listen('entity:model:loaded', ({ success, meshCount, errorMessage }) => {
		orientDisplayShip(ship);
		const status = success
			? `loaded (${meshCount ?? 0} meshes)`
			: formatLoadError(errorMessage);
		statusLabel.updateText(status);
		updateDebugStatus(name, status);
	});

	ship.onUpdate(({ me, delta }) => {
		me.rotateZ(spinSpeed * delta);
	});

	return ship;
}

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 1.5, z: 23 },
		target: { x: 0, y: 1.5, z: 0 },
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, 0, 0),
			backgroundColor: new Color('#030711'),
			assetLoaders: {
				gltf: {
					meshopt: true,
				},
			},
		},
		camera,
	);

	stage.onSetup(({ stage: activeStage }: any) => {
		const scene = activeStage?.wrappedStage?.scene?.scene;
		if (!scene) {
			return;
		}

		if (!scene.getObjectByName('optimized-ships-ab-ambient')) {
			const ambient = new AmbientLight('#f8fafc', 1.95);
			ambient.name = 'optimized-ships-ab-ambient';
			scene.add(ambient);
		}

		if (!scene.getObjectByName('optimized-ships-ab-hemi')) {
			const hemi = new HemisphereLight('#dbeafe', '#020617', 1.8);
			hemi.name = 'optimized-ships-ab-hemi';
			hemi.position.set(0, 8, 10);
			scene.add(hemi);
		}

		if (!scene.getObjectByName('optimized-ships-ab-key')) {
			const key = new DirectionalLight('#ffffff', 2.5);
			key.name = 'optimized-ships-ab-key';
			key.position.set(8, 10, 14);
			scene.add(key);
		}

		if (!scene.getObjectByName('optimized-ships-ab-rim')) {
			const rim = new DirectionalLight('#67e8f9', 2);
			rim.name = 'optimized-ships-ab-rim';
			rim.position.set(-10, 6, 16);
			scene.add(rim);
		}
	});

	const rows: ShipRowConfig[] = [
		{
			id: 'fisher',
			label: 'Fisher Ship',
			rawModel: rawFisherShipGlb,
			optimizedModel: fisherShipGlb,
			y: 6.4,
			scale: 1.15,
			spinSpeed: 0.15,
		},
		{
			id: 'snake',
			label: 'Snake Ship',
			rawModel: rawSnakeShipGlb,
			optimizedModel: snakeShipGlb,
			y: 2.3,
			scale: 1,
			spinSpeed: 0.21,
		},
		{
			id: 'vulture',
			label: 'Vulture Ship',
			rawModel: rawVultureShipGlb,
			optimizedModel: vultureShipGlb,
			y: -1.9,
			scale: 1,
			spinSpeed: -0.19,
		},
		{
			id: 'cougar',
			label: 'Cougar Ship',
			rawModel: rawCougarShipGlb,
			optimizedModel: cougarShipGlb,
			y: -6,
			scale: 1.12,
			spinSpeed: -0.14,
		},
	];

	const entities: DemoEntity[] = [
		createWorldLabel(
			'optimized-ships-ab-title',
			'Raw vs Meshopt GLB Comparison',
			{ x: 0, y: 10.8, z: 0 },
			30,
		),
		createWorldLabel(
			'optimized-ships-ab-raw-header',
			'Raw Assets',
			{ x: RAW_COLUMN_X, y: 9, z: 0 },
			24,
		),
		createWorldLabel(
			'optimized-ships-ab-optimized-header',
			'Meshopt Assets',
			{ x: OPTIMIZED_COLUMN_X, y: 9, z: 0 },
			24,
		),
		createWorldLabel(
			'optimized-ships-ab-note',
			'Each row loads the same ship twice from different asset folders.',
			{ x: 0, y: -10.3, z: 0 },
			18,
		),
	];

	for (const row of rows) {
		const rowLabel = createWorldLabel(
			`${row.id}-row-label`,
			row.label,
			{ x: 0, y: row.y + 1.55, z: 0 },
			22,
		);
		const rawStatus = createStatusLabel(
			`${row.id}-raw-status`,
			{ x: RAW_COLUMN_X, y: row.y - 1.9, z: 0 },
		);
		const optimizedStatus = createStatusLabel(
			`${row.id}-optimized-status`,
			{ x: OPTIMIZED_COLUMN_X, y: row.y - 1.9, z: 0 },
		);
		const rawShip = createDisplayShip({
			name: `${row.id}-raw-ship`,
			model: row.rawModel,
			position: { x: RAW_COLUMN_X, y: row.y, z: 0 },
			scale: row.scale,
			spinSpeed: row.spinSpeed,
			statusLabel: rawStatus,
		});
		const optimizedShip = createDisplayShip({
			name: `${row.id}-optimized-ship`,
			model: row.optimizedModel,
			position: { x: OPTIMIZED_COLUMN_X, y: row.y, z: 0 },
			scale: row.scale,
			spinSpeed: row.spinSpeed,
			statusLabel: optimizedStatus,
		});

		entities.push(rowLabel, rawStatus, optimizedStatus, rawShip, optimizedShip);
	}

	stage.add(...entities);

	return createGame(
		{
			id: 'optimized-ships-ab',
		},
		stage,
	);
}
