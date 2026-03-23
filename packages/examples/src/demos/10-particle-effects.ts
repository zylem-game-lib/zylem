import { Color, Vector3 } from 'three';
import {
	createBox,
	createCamera,
	createGame,
	createParticleSystem,
	createStage,
	createText,
	particlePresets,
	type ParticleEffectDefinition,
} from '@zylem/game-lib';
import {
	particleEffectsDemoLabels,
	type ParticleEffectsDemoLabelKey,
} from './particle-effects/labels';

interface ParticleDemoStationConfig {
	labelKey: ParticleEffectsDemoLabelKey;
	labelColor: string;
	padColor: string;
	columnColor: string;
	preset: ParticleEffectDefinition;
	repeatAfterSeconds?: number;
}

interface ParticleDemoStation extends ParticleDemoStationConfig {
	position: { x: number; y: number; z: number };
}

const GRID_COLUMNS = 6;
const GRID_X_SPACING = 6.2;
const GRID_Z_SPACING = 7.2;
const STATION_Y = 0.72;
const PAD_SIZE = 2.75;

function station(
	labelKey: ParticleEffectsDemoLabelKey,
	theme: {
		labelColor: string;
		padColor: string;
		columnColor: string;
	},
	preset: ParticleEffectDefinition,
	repeatAfterSeconds?: number,
): ParticleDemoStationConfig {
	return {
		labelKey,
		labelColor: theme.labelColor,
		padColor: theme.padColor,
		columnColor: theme.columnColor,
		preset,
		repeatAfterSeconds,
	};
}

const stationConfigs: readonly ParticleDemoStationConfig[] = [
	station(
		'fireSpark',
		{
			labelColor: '#ffd166',
			padColor: '#412015',
			columnColor: '#f97316',
		},
		particlePresets.fire.spark(),
		1,
	),
	station(
		'fireBlaze',
		{
			labelColor: '#fb923c',
			padColor: '#4a2315',
			columnColor: '#ea580c',
		},
		particlePresets.fire.blaze(),
	),
	station(
		'waterHolyMist',
		{
			labelColor: '#f8e7a0',
			padColor: '#123247',
			columnColor: '#60a5fa',
		},
		particlePresets.water.mist({
			magic: 'holy',
		}),
	),
	station(
		'waterTorrent',
		{
			labelColor: '#67e8f9',
			padColor: '#102d42',
			columnColor: '#0ea5e9',
		},
		particlePresets.water.torrent(),
	),
	station(
		'gasVapor',
		{
			labelColor: '#e2e8f0',
			padColor: '#253445',
			columnColor: '#94a3b8',
		},
		particlePresets.gas.vapor(),
	),
	station(
		'gasCorruptedMiasma',
		{
			labelColor: '#bef264',
			padColor: '#203217',
			columnColor: '#65a30d',
		},
		particlePresets.gas.miasma({
			magic: 'corrupted',
		}),
	),
	station(
		'electricArc',
		{
			labelColor: '#a5f3fc',
			padColor: '#1b2b4a',
			columnColor: '#38bdf8',
		},
		particlePresets.electricity.arc(),
	),
	station(
		'electricStorm',
		{
			labelColor: '#bfdbfe',
			padColor: '#1d2546',
			columnColor: '#2563eb',
		},
		particlePresets.electricity.storm(),
	),
	station(
		'arcaneFlamelet',
		{
			labelColor: '#93c5fd',
			padColor: '#24234a',
			columnColor: '#3b82f6',
		},
		particlePresets.fire.flamelet({
			magic: particlePresets.magic.arcane({
				order: 'geometric',
				realityEffect: 'warping',
			}),
		}),
	),
	station(
		'natureEmber',
		{
			labelColor: '#86efac',
			padColor: '#203226',
			columnColor: '#22c55e',
		},
		particlePresets.fire.ember({
			magic: particlePresets.magic.nature({
				order: 'organic',
				realityEffect: 'healing',
			}),
		}),
	),
	station(
		'voidVapor',
		{
			labelColor: '#c4b5fd',
			padColor: '#202338',
			columnColor: '#7c3aed',
		},
		particlePresets.gas.vapor({
			magic: particlePresets.magic.void({
				agency: 'seeking',
				order: 'chaotic',
			}),
		}),
	),
	station(
		'psychicPulse',
		{
			labelColor: '#f9a8d4',
			padColor: '#352141',
			columnColor: '#ec4899',
		},
			particlePresets.electricity.pulse({
				magic: particlePresets.magic.psychic({
					agency: 'sentient-feeling',
					order: 'organic',
					realityEffect: 'binding',
				}),
			}),
		1,
	),
	station(
		'fireEmber',
		{
			labelColor: '#fdba74',
			padColor: '#3d2418',
			columnColor: '#c2410c',
		},
		particlePresets.fire.ember(),
	),
	station(
		'fireFlamelet',
		{
			labelColor: '#f59e0b',
			padColor: '#412315',
			columnColor: '#f97316',
		},
		particlePresets.fire.flamelet(),
	),
	station(
		'fireSmolder',
		{
			labelColor: '#d6a56e',
			padColor: '#35261f',
			columnColor: '#a16207',
		},
		particlePresets.fire.smolder(),
	),
	station(
		'waterSpray',
		{
			labelColor: '#93c5fd',
			padColor: '#132c44',
			columnColor: '#38bdf8',
		},
		particlePresets.water.spray(),
	),
	station(
		'waterSplash',
		{
			labelColor: '#bae6fd',
			padColor: '#17324b',
			columnColor: '#0ea5e9',
		},
		particlePresets.water.splash(),
		1,
	),
	station(
		'waterDrizzle',
		{
			labelColor: '#e0f2fe',
			padColor: '#1a3550',
			columnColor: '#7dd3fc',
		},
		particlePresets.water.drizzle(),
	),
	station(
		'gasSmoke',
		{
			labelColor: '#d4d4d8',
			padColor: '#2c3440',
			columnColor: '#737373',
		},
		particlePresets.gas.smoke(),
	),
	station(
		'gasHaze',
		{
			labelColor: '#cbd5e1',
			padColor: '#26384a',
			columnColor: '#94a3b8',
		},
		particlePresets.gas.haze(),
	),
	station(
		'gasPlume',
		{
			labelColor: '#dbeafe',
			padColor: '#243446',
			columnColor: '#64748b',
		},
		particlePresets.gas.plume(),
	),
	station(
		'electricSpark',
		{
			labelColor: '#cffafe',
			padColor: '#1f2b4b',
			columnColor: '#22d3ee',
		},
		particlePresets.electricity.spark(),
		1,
	),
	station(
		'electricSurge',
		{
			labelColor: '#7dd3fc',
			padColor: '#1c2849',
			columnColor: '#0ea5e9',
		},
		particlePresets.electricity.surge(),
		1,
	),
	station(
		'electricPulse',
		{
			labelColor: '#a5f3fc',
			padColor: '#202b45',
			columnColor: '#06b6d4',
		},
		particlePresets.electricity.pulse(),
		1,
	),
] as const;

const GRID_ROWS = Math.ceil(stationConfigs.length / GRID_COLUMNS);
const FLOOR_SIZE_X = GRID_X_SPACING * (GRID_COLUMNS - 1) + 10;
const FLOOR_SIZE_Z = GRID_Z_SPACING * (GRID_ROWS - 1) + 10;

function layoutStations(
	configs: readonly ParticleDemoStationConfig[],
): ParticleDemoStation[] {
	const rowOffset = (GRID_ROWS - 1) / 2;
	const columnOffset = (GRID_COLUMNS - 1) / 2;

	return configs.map((config, index) => {
		const column = index % GRID_COLUMNS;
		const row = Math.floor(index / GRID_COLUMNS);

		return {
			...config,
			position: {
				x: (column - columnOffset) * GRID_X_SPACING,
				y: STATION_Y,
				z: (row - rowOffset) * GRID_Z_SPACING,
			},
		};
	});
}

const stations = layoutStations(stationConfigs);

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 14.2, z: 28.4 },
		target: { x: 0, y: 1.8, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: new Color('#061018'),
			gravity: new Vector3(0, 0, 0),
		},
		camera,
	);

	const floor = createBox({
		name: 'particle-floor',
		position: { x: 0, y: -0.4, z: 0 },
		size: { x: FLOOR_SIZE_X, y: 0.8, z: FLOOR_SIZE_Z },
		material: {
			color: new Color('#0d2230'),
		},
	});

	const runway = createBox({
		name: 'particle-runway',
		position: { x: 0, y: 0.02, z: 0 },
		size: { x: FLOOR_SIZE_X, y: 0.04, z: 2.2 },
		material: {
			color: new Color('#123347'),
		},
	});

	const titleText = createText({
		name: 'particle-title',
		text: particleEffectsDemoLabels.title,
		fontSize: 18,
		fontColor: '#f8fafc',
		backgroundColor: '#102434',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.07 },
	});

	const statusText = createText({
		name: 'particle-status',
		text: particleEffectsDemoLabels.status,
		fontSize: 15,
		fontColor: '#cbd5e1',
		backgroundColor: '#102c3d',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.12 },
	});

	stage.add(floor, runway, titleText, statusText);

	const repeatingEmitters: Array<{
		emitter: ReturnType<typeof createParticleSystem>;
		elapsedSeconds: number;
		repeatAfterSeconds: number;
	}> = [];

	for (const station of stations) {
		const copy = particleEffectsDemoLabels.stations[station.labelKey];
		const slug = copy.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');

		const pad = createBox({
			name: `${slug}-pad`,
			position: { x: station.position.x, y: 0.12, z: station.position.z },
			size: { x: PAD_SIZE, y: 0.24, z: PAD_SIZE },
			material: {
				color: new Color(station.padColor),
			},
		});

		const column = createBox({
			name: `${slug}-column`,
			position: { x: station.position.x, y: 0.5, z: station.position.z },
			size: { x: 0.34, y: 0.72, z: 0.34 },
			material: {
				color: new Color(station.columnColor),
			},
		});

		const emitter = createParticleSystem({
			name: `${slug}-effect`,
			position: station.position,
			preset: station.preset,
			autoplay: true,
		});
		if (station.repeatAfterSeconds !== undefined) {
			repeatingEmitters.push({
				emitter,
				elapsedSeconds: 0,
				repeatAfterSeconds: station.repeatAfterSeconds,
			});
		}

		const label = createText({
			name: `${slug}-label`,
			text: `${copy.name}\n${copy.description}`,
			position: {
				x: station.position.x,
				y: station.position.y + 1.95,
				z: station.position.z,
			},
			fontSize: 13,
			fontColor: station.labelColor,
			backgroundColor: '#091723',
			padding: 8,
			stickToViewport: false,
		});

		stage.add(pad, column, emitter, label);
	}

	const game = createGame(
		{
			id: 'particle-effects',
			debug: true,
		},
		stage,
	);

	game.onUpdate(({ delta }) => {
		for (const repeating of repeatingEmitters) {
			repeating.elapsedSeconds += delta;
			if (repeating.elapsedSeconds < repeating.repeatAfterSeconds) {
				continue;
			}

			repeating.emitter.restart();
			repeating.elapsedSeconds = 0;
		}
	});

	return game;
}
