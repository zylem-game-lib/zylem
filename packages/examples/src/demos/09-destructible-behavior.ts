import { Color, Vector3 } from 'three';
import {
	createBox,
	createCamera,
	createGame,
	createStage,
	createText,
	Destructible3DBehavior,
	FractureOptions,
	type Destructible3DHandle,
	useArrowsForDirections,
} from '@zylem/game-lib';

type ShowcaseTarget = {
	label: string;
	handle: Destructible3DHandle;
	accent: Color;
};

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 6.5, z: 14 },
		target: { x: 0, y: 2.5, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: new Color('#09111a'),
		},
		camera,
	);

	stage.setInputConfiguration(useArrowsForDirections('p1'));

	const floor = createBox({
		name: 'floor',
		position: { x: 0, y: -0.35, z: 0 },
		size: { x: 20, y: 0.7, z: 12 },
		collision: { static: true },
		material: {
			color: new Color('#13202c'),
		},
	});

	const backdrop = createBox({
		name: 'backdrop',
		position: { x: 0, y: 4.2, z: -4.4 },
		size: { x: 18, y: 9, z: 0.4 },
		collision: { static: true },
		material: {
			color: new Color('#102332'),
			opacity: 0.92,
		},
	});

	const instructionText = createText({
		name: 'destructible-instructions',
		text: 'Left/Right changes focus. A fractures focused target. B repairs all.',
		fontSize: 17,
		fontColor: '#f8fafc',
		backgroundColor: '#13202c',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.06 },
	});

	const focusText = createText({
		name: 'destructible-focus',
		text: 'Focused: Simple Fracture',
		fontSize: 18,
		fontColor: '#dbeafe',
		backgroundColor: '#163047',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.12 },
	});

	const statusText = createText({
		name: 'destructible-status',
		text: 'Status: ready',
		fontSize: 18,
		fontColor: '#bfdbfe',
		backgroundColor: '#112438',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.18 },
	});

	const targetConfigs = [
		{
			label: 'Simple Fracture',
			position: new Vector3(-4.8, 2.3, 0),
			accent: new Color('#f4b942'),
			options: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 6,
				fracturePlanes: {
					x: true,
					y: true,
					z: false,
				},
				seed: 11,
			}),
		},
		{
			label: 'Voronoi 3D',
			position: new Vector3(0, 2.3, 0),
			accent: new Color('#67e8f9'),
			options: new FractureOptions({
				fractureMethod: 'voronoi',
				fragmentCount: 14,
				voronoiOptions: {
					mode: '3D',
				},
				seed: 23,
			}),
		},
		{
			label: 'Impact Voronoi',
			position: new Vector3(4.8, 2.3, 0),
			accent: new Color('#fb7185'),
			options: new FractureOptions({
				fractureMethod: 'voronoi',
				fragmentCount: 20,
				voronoiOptions: {
					mode: '3D',
					impactPoint: new Vector3(0.4, 0.25, 0.15),
					impactRadius: 0.6,
				},
				seed: 7,
			}),
		},
	] as const;

	const pedestals = targetConfigs.map((target) =>
		createBox({
			name: `${target.label.toLowerCase().replace(/\s+/g, '-')}-pedestal`,
			position: { x: target.position.x, y: 0.8, z: target.position.z },
			size: { x: 2.5, y: 1.6, z: 2.5 },
			collision: { static: true },
			material: {
				color: target.accent.clone().multiplyScalar(0.35),
			},
		}),
	);

	const targets = targetConfigs.map((target) => {
		const crate = createBox({
			name: `${target.label.toLowerCase().replace(/\s+/g, '-')}-crate`,
			position: { x: target.position.x, y: target.position.y, z: target.position.z },
			size: { x: 1.8, y: 1.8, z: 1.8 },
			collision: { static: true },
			material: {
				color: target.accent.clone(),
			},
		});

		const handle = crate.use(Destructible3DBehavior, {
			fractureOptions: target.options,
		});

		const label = createText({
			name: `${target.label.toLowerCase().replace(/\s+/g, '-')}-label`,
			text: target.label,
			fontSize: 32,
			fontColor: `#${target.accent.getHexString()}`,
			backgroundColor: '#0b1620',
			stickToViewport: false,
			position: {
				x: target.position.x,
				y: 4.15,
				z: target.position.z,
			},
		});

		stage.add(crate, label);

		return {
			label: target.label,
			handle,
			accent: target.accent,
		};
	});

	stage.add(floor, backdrop, ...pedestals);

	let focusedIndex = 0;

	const setFocusText = () => {
		focusText.updateText(`Focused: ${targets[focusedIndex]!.label}`);
	};

	const setStatusText = (message: string) => {
		statusText.updateText(`Status: ${message}`);
	};

	const fractureTarget = (index: number, source: 'auto' | 'manual') => {
		const target = targets[index];
		if (!target) {
			return;
		}

		target.handle.fracture();
		setStatusText(`${source} fracture -> ${target.label}`);
	};

	const repairAllTargets = (source: 'auto' | 'manual') => {
		for (const target of targets) {
			target.handle.repair();
		}
		setStatusText(`${source} repair -> restored all targets`);
	};

	setFocusText();

	const game = createGame(
		{
			id: 'destructible-behavior-demo',
			debug: true,
		},
		stage,
		instructionText,
		focusText,
		statusText,
	).onUpdate(({ inputs, delta }) => {
		const { p1 } = inputs;

		if (p1.directions.Left?.pressed) {
			focusedIndex =
				(focusedIndex - 1 + targets.length) % targets.length;
			setFocusText();
		}

		if (p1.directions.Right?.pressed) {
			focusedIndex = (focusedIndex + 1) % targets.length;
			setFocusText();
		}

		if (p1.buttons.A?.pressed) {
			fractureTarget(focusedIndex, 'manual');
		}

		if (p1.buttons.B?.pressed) {
			repairAllTargets('manual');
		}
	});

	return game;
}
