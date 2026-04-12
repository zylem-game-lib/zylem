import {
	createText,
	TEXT_TYPE,
} from '@zylem/game-lib';

const HUD_NAMES = {
	lives: 'space-invaders-3d-lives',
	wave: 'space-invaders-3d-wave',
	score: 'space-invaders-3d-score',
	status: 'space-invaders-3d-status',
	gameOver: 'space-invaders-3d-game-over',
} as const;

const HUD_LAYOUT = {
	lives: { x: 0.12, y: 0.06 },
	wave: { x: 0.5, y: 0.06 },
	score: { x: 0.88, y: 0.06 },
	status: { x: 0.5, y: 0.16 },
	gameOver: { x: 0.5, y: 0.5 },
} as const;

type HudVisibilityTarget = {
	group?: { visible: boolean };
	mesh?: { visible: boolean };
};

type HudTextEntity = HudVisibilityTarget & {
	updateText?: (value: string) => void;
};

type HudStage = {
	getEntityByName?: (name: string, type: unknown) => HudTextEntity | undefined;
};

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
	return currentStage?.getEntityByName?.(name, TEXT_TYPE);
}

export function createSpaceInvadersHud() {
	const livesText = createStickyText({
		name: HUD_NAMES.lives,
		text: 'Lives: 3',
		fontSize: 18,
		fontColor: '#f8fafc',
		backgroundColor: '#08131c',
		padding: 8,
		screenPosition: HUD_LAYOUT.lives,
	});

	const waveText = createStickyText({
		name: HUD_NAMES.wave,
		text: 'Wave 1',
		fontSize: 18,
		fontColor: '#dbeafe',
		backgroundColor: '#08131c',
		padding: 8,
		screenPosition: HUD_LAYOUT.wave,
	});

	const scoreText = createStickyText({
		name: HUD_NAMES.score,
		text: 'Score: 0',
		fontSize: 18,
		fontColor: '#f8fafc',
		backgroundColor: '#08131c',
		padding: 8,
		screenPosition: HUD_LAYOUT.score,
	});

	const statusText = createStickyText({
		name: HUD_NAMES.status,
		text: '',
		fontSize: 24,
		fontColor: '#fde68a',
		backgroundColor: null,
		padding: 10,
		screenPosition: HUD_LAYOUT.status,
	});
	statusText.onSetup(() => {
		setEntityVisibility(statusText, false);
	});

	const gameOverText = createStickyText({
		name: HUD_NAMES.gameOver,
		text: '',
		fontSize: 40,
		fontColor: '#f8fafc',
		backgroundColor: null,
		padding: 14,
		screenPosition: HUD_LAYOUT.gameOver,
	});
	gameOverText.onSetup(() => {
		setEntityVisibility(gameOverText, false);
	});

	return {
		livesText,
		waveText,
		scoreText,
		statusText,
		gameOverText,
	};
}

export function updateLivesHud(
	lives: number,
	currentStage?: HudStage,
) {
	getHudText(currentStage, HUD_NAMES.lives)?.updateText?.(
		`Lives: ${Math.max(0, lives)}`,
	);
}

export function updateWaveHud(
	wave: number,
	currentStage?: HudStage,
) {
	getHudText(currentStage, HUD_NAMES.wave)?.updateText?.(
		`Wave ${Math.max(1, wave)}`,
	);
}

export function updateScoreHud(
	score: number,
	currentStage?: HudStage,
) {
	getHudText(currentStage, HUD_NAMES.score)?.updateText?.(
		`Score: ${Math.max(0, score)}`,
	);
}

export function updateStatusHud(
	text: string,
	currentStage?: HudStage,
) {
	const status = getHudText(currentStage, HUD_NAMES.status);
	status?.updateText?.(text);
	setEntityVisibility(status, text.length > 0);
}

export function updateGameOverHud(
	gameOver: boolean,
	currentStage?: HudStage,
) {
	const gameOverText = getHudText(currentStage, HUD_NAMES.gameOver);
	const value = gameOver ? 'Game Over' : '';
	gameOverText?.updateText?.(value);
	setEntityVisibility(gameOverText, value.length > 0);
}
