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

export function createAsteroidHud() {
	const healthBarFrame = createRect({
		name: 'asteroids-3d-health-frame',
		width: HEALTH_BAR_WIDTH,
		height: HEALTH_BAR_HEIGHT,
		fillColor: 'rgba(15, 23, 42, 0.45)',
		strokeColor: '#e2e8f0',
		strokeWidth: 2,
		radius: 10,
		padding: 2,
		stickToViewport: true,
		screenPosition: { x: 28, y: 28 },
	});

	const healthBarFill = createRect({
		name: 'asteroids-3d-health-fill',
		width: HEALTH_BAR_WIDTH,
		height: HEALTH_BAR_HEIGHT,
		fillColor: '#22c55e',
		radius: 8,
		stickToViewport: true,
		screenPosition: { x: 30, y: 30 },
	});

	const healthLabel = createText({
		name: 'asteroids-3d-health-label',
		text: 'Hull: 100%',
		fontSize: 14,
		fontColor: '#f8fafc',
		backgroundColor: '#0f172a',
		padding: 6,
		stickToViewport: true,
		screenPosition: { x: 0.14, y: 0.11 },
	});

	const scoreText = createText({
		name: 'asteroids-3d-score',
		text: 'Score: 0',
		fontSize: 18,
		fontColor: '#f8fafc',
		backgroundColor: '#091723',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.88, y: 0.06 },
	});

	const gameOverText = createText({
		name: 'asteroids-3d-game-over',
		text: '',
		fontSize: 36,
		fontColor: '#f8fafc',
		backgroundColor: '#0f172a',
		padding: 14,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.5 },
	});
	gameOverText.onSetup(() => {
		if (gameOverText.group) {
			gameOverText.group.visible = false;
		}
		if (gameOverText.mesh) {
			gameOverText.mesh.visible = false;
		}
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
	currentStage?: { getEntityByName?: (name: string, type: unknown) => { updateText: (value: string) => void } | undefined },
) {
	currentStage
		?.getEntityByName?.('asteroids-3d-score', TEXT_TYPE)
		?.updateText(`Score: ${score}`);
}

export function updateHealthHud(
	health: number,
	currentStage?: {
		getEntityByName?: (
			name: string,
			type: unknown,
		) => {
			updateRect?: (next: { width: number; fillColor: string }) => void;
			updateText?: (value: string) => void;
		} | undefined;
	},
) {
	const clampedHealth = Math.max(0, Math.min(PLAYER_MAX_HEALTH, health));
	const ratio = clampedHealth / PLAYER_MAX_HEALTH;
	const fill = currentStage?.getEntityByName?.('asteroids-3d-health-fill', RECT_TYPE);
	fill?.updateRect?.({
		width: Math.max(0, Math.round(HEALTH_BAR_WIDTH * ratio)),
		fillColor:
			ratio > 0.6
				? '#22c55e'
				: ratio > 0.3
					? '#f59e0b'
					: '#ef4444',
	});

	currentStage
		?.getEntityByName?.('asteroids-3d-health-label', TEXT_TYPE)
		?.updateText?.(`Hull: ${Math.round(ratio * 100)}%`);
}

export function updateGameOverHud(
	gameOver: boolean,
	currentStage?: {
		getEntityByName?: (
			name: string,
			type: unknown,
		) => {
			group?: { visible: boolean };
			mesh?: { visible: boolean };
			updateText: (value: string) => void;
		} | undefined;
	},
) {
	const gameOverEntity = currentStage?.getEntityByName?.('asteroids-3d-game-over', TEXT_TYPE);
	const value = gameOver ? 'Game Over' : '';
	gameOverEntity?.updateText(value);
	if (gameOverEntity?.group) {
		gameOverEntity.group.visible = value.length > 0;
	}
	if (gameOverEntity?.mesh) {
		gameOverEntity.mesh.visible = value.length > 0;
	}
}
