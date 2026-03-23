import {
	createRect,
	createText,
	RECT_TYPE,
	TEXT_TYPE,
} from '@zylem/game-lib';
import {
	HEALTH_BAR_HEIGHT,
	HEALTH_BAR_WIDTH,
	PLAYER_MAX_HEALTH,
} from './shared';

const HUD_NAMES = {
	healthFrame: 'asteroids-3d-health-frame',
	healthFill: 'asteroids-3d-health-fill',
	healthLabel: 'asteroids-3d-health-label',
	score: 'asteroids-3d-score',
	gameOver: 'asteroids-3d-game-over',
} as const;

const HUD_LAYOUT = {
	healthFramePosition: { x: 30, y: 30 },
	healthFillPosition: { x: 35, y: 35 },
	healthLabelPosition: { x: 60, y: 43 },
	scorePosition: { x: 0.88, y: 0.06 },
	gameOverPosition: { x: 0.5, y: 0.5 },
	healthInset: 2,
} as const;

const HEALTH_FILL_WIDTH = HEALTH_BAR_WIDTH - HUD_LAYOUT.healthInset * 2;
const HEALTH_FILL_HEIGHT = HEALTH_BAR_HEIGHT - HUD_LAYOUT.healthInset * 2;

type HudVisibilityTarget = {
	group?: { visible: boolean };
	mesh?: { visible: boolean };
};

type HudTextEntity = HudVisibilityTarget & {
	updateText?: (value: string) => void;
};

type HudRectEntity = HudVisibilityTarget & {
	updateRect?: (next: { width: number; fillColor: string }) => void;
};

type HudStage = {
	getEntityByName?: (name: string, type: unknown) => HudTextEntity | HudRectEntity | undefined;
};

function createStickyRect(options: Parameters<typeof createRect>[0]) {
	return createRect({
		stickToViewport: true,
		...options,
	});
}

function createStickyText(options: Parameters<typeof createText>[0]) {
	return createText({
		stickToViewport: true,
		...options,
	});
}

function setEntityVisibility(entity: HudVisibilityTarget | undefined, visible: boolean) {
	if (entity?.group) {
		entity.group.visible = visible;
	}

	if (entity?.mesh) {
		entity.mesh.visible = visible;
	}
}

function getHudText(currentStage: HudStage | undefined, name: string) {
	return currentStage?.getEntityByName?.(name, TEXT_TYPE) as HudTextEntity | undefined;
}

function getHudRect(currentStage: HudStage | undefined, name: string) {
	return currentStage?.getEntityByName?.(name, RECT_TYPE) as HudRectEntity | undefined;
}

export function createAsteroidHud() {
	const healthBarFrame = createStickyRect({
		name: HUD_NAMES.healthFrame,
		width: HEALTH_BAR_WIDTH,
		height: HEALTH_BAR_HEIGHT,
		fillColor: 'rgba(15, 23, 42, 0.45)',
		strokeColor: '#e2e8f0',
		strokeWidth: 2,
		radius: 10,
		padding: 2,
		screenPosition: HUD_LAYOUT.healthFramePosition,
	});

	const healthBarFill = createStickyRect({
		name: HUD_NAMES.healthFill,
		width: HEALTH_FILL_WIDTH,
		height: HEALTH_FILL_HEIGHT,
		fillColor: '#22c55e',
		radius: 10,
		screenPosition: HUD_LAYOUT.healthFillPosition,
	});

	const healthLabel = createStickyText({
		name: HUD_NAMES.healthLabel,
		text: '100%',
		fontSize: 12,
		fontColor: '#000000',
		backgroundColor: null,
		padding: 6,
		screenPosition: HUD_LAYOUT.healthLabelPosition,
	});

	const scoreText = createStickyText({
		name: HUD_NAMES.score,
		text: 'Score: 0',
		fontSize: 18,
		fontColor: '#f8fafc',
		backgroundColor: '#091723',
		padding: 8,
		screenPosition: HUD_LAYOUT.scorePosition,
	});

	const gameOverText = createStickyText({
		name: HUD_NAMES.gameOver,
		text: '',
		fontSize: 36,
		fontColor: '#f8fafc',
		backgroundColor: null,
		padding: 14,
		screenPosition: HUD_LAYOUT.gameOverPosition,
	});
	gameOverText.onSetup(() => {
		setEntityVisibility(gameOverText, false);
	});

	return {
		healthBarFrame,
		healthBarFill,
		healthLabel,
		scoreText,
		gameOverText,
	};
}

export function updateScoreHud(
	score: number,
	currentStage?: HudStage,
) {
	getHudText(currentStage, HUD_NAMES.score)?.updateText?.(`Score: ${score}`);
}

export function updateHealthHud(
	health: number,
	currentStage?: HudStage,
) {
	const clampedHealth = Math.max(0, Math.min(PLAYER_MAX_HEALTH, health));
	const ratio = clampedHealth / PLAYER_MAX_HEALTH;
	const fillColor =
		ratio > 0.6 ? '#22c55e' : ratio > 0.3 ? '#f59e0b' : '#ef4444';
	const fillVisible = clampedHealth > 0;
	const fill = getHudRect(currentStage, HUD_NAMES.healthFill);

	fill?.updateRect?.({
		width: Math.max(0, Math.round(HEALTH_FILL_WIDTH * ratio)),
		fillColor,
	});
	setEntityVisibility(fill, fillVisible);

	getHudText(currentStage, HUD_NAMES.healthLabel)?.updateText?.(
		`${Math.round(ratio * 100)}%`,
	);
}

export function updateGameOverHud(
	gameOver: boolean,
	currentStage?: HudStage,
) {
	const gameOverEntity = getHudText(currentStage, HUD_NAMES.gameOver);
	const value = gameOver ? 'Game Over' : '';
	gameOverEntity?.updateText?.(value);
	setEntityVisibility(gameOverEntity, value.length > 0);
}
