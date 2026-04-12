import {
	AmbientLight,
	Color,
	DirectionalLight,
	HemisphereLight,
	Vector3,
} from 'three';
import {
	createCamera,
	createGame,
	createSphere,
	createStage,
	destroy,
	setGlobal,
	useArrowsForAxes,
	useWASDForAxes,
} from '@zylem/game-lib';
import {
	createCougarShipRuntime,
	updateCougarShip,
} from './3d-space-invaders/cougar-ship';
import type { EnemyRuntime } from './3d-space-invaders/enemy-common';
import { createSpaceInvadersEffects } from './3d-space-invaders/effects';
import {
	createSpaceInvadersHud,
	updateGameOverHud,
	updateLivesHud,
	updateScoreHud,
	updateStatusHud,
	updateWaveHud,
} from './3d-space-invaders/hud';
import { createPlayerShip } from './3d-space-invaders/player-ship';
import {
	createSnakeShipRuntime,
	updateSnakeShip,
} from './3d-space-invaders/snake-ship';
import {
	type EnemyKind,
	ANNOUNCEMENT_DURATION_SECONDS,
	BULLET_BOUNDS_X,
	BULLET_BOUNDS_Y,
	BULLET_RADIUS,
	ENEMY_BULLET_COLLISION_TYPE,
	ENEMY_BULLET_SPEED,
	ENEMY_COLORS,
	ENEMY_COLLISION_TYPE,
	ENEMY_SCORES,
	PLAYER_BOUNDS_X,
	PLAYER_BULLET_COLLISION_TYPE,
	PLAYER_BULLET_SPEED,
	PLAYER_COLLISION_TYPE,
	PLAYER_DAMAGE_COOLDOWN_SECONDS,
	PLAYER_MAX_LIVES,
	PLAYER_SHOOT_COOLDOWN_SECONDS,
	PLAYER_SPEED,
	PLAYER_START_Y,
	SHIP_FRAGMENT_TTL_SECONDS,
	SINE_BULLET_AMPLITUDE,
	SINE_BULLET_FREQUENCY,
	WAVE_COLUMNS,
	WAVE_KIND_ORDER,
	WAVE_RESPAWN_DELAY_SECONDS,
	WAVE_ROWS,
	clamp,
	getEntityPosition,
	setEntityVisibility,
	setWorldPosition,
} from './3d-space-invaders/shared';
import {
	createVultureShipRuntime,
	updateVultureShip,
} from './3d-space-invaders/vulture-ship';
import { starfieldShader } from './planet-demo/starfield.shader';

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 0, z: 14 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, 0, 0),
			backgroundShader: starfieldShader,
			assetLoaders: {
				gltf: {
					ktx2TranscoderPath: '/three/basis/',
				},
			},
		},
		camera,
	);

	stage.setInputConfiguration(
		useArrowsForAxes('p1'),
		useWASDForAxes('p1'),
		{
			p1: {
				key: {
					' ': ['buttons.a'],
				},
			},
		},
	);

	stage.onSetup(({ stage: activeStage }: any) => {
		const scene = (activeStage as any)?.wrappedStage?.scene?.scene;
		if (!scene) {
			return;
		}

		if (!scene.getObjectByName('space-invaders-fill-ambient')) {
			const ambient = new AmbientLight('#dbeafe', 1.7);
			ambient.name = 'space-invaders-fill-ambient';
			scene.add(ambient);
		}

		if (!scene.getObjectByName('space-invaders-fill-hemi')) {
			const hemi = new HemisphereLight('#dcfce7', '#090f1b', 1.55);
			hemi.name = 'space-invaders-fill-hemi';
			hemi.position.set(0, 0, 18);
			scene.add(hemi);
		}

		if (!scene.getObjectByName('space-invaders-rim-light')) {
			const rim = new DirectionalLight('#f9a8d4', 2.3);
			rim.name = 'space-invaders-rim-light';
			rim.position.set(-10, 8, 18);
			scene.add(rim);
		}
	});

	const hud = createSpaceInvadersHud();
	const player = createPlayerShip();
	const effects = createSpaceInvadersEffects();

	const projectiles = new Set<ReturnType<typeof createSphere>>();
	const enemyRuntimeByUuid = new Map<string, EnemyRuntime>();
	const pendingEntityCleanup = new Map<
		string,
		{ entity: { uuid: string }; ttl: number }
	>();
	let enemyRuntimes: EnemyRuntime[] = [];
	let shootCooldown = 0;
	let playerDamageCooldown = 0;
	let announcementTimer = 0;
	let nextWaveTimer = 0;

	stage.add(
		player.entity,
		player.shield,
		...effects.entities,
	);
	player.entity.onDestroy(() => {
		pendingEntityCleanup.delete(player.entity.uuid);
	});

	function getPlayerPosition() {
		return getEntityPosition(player.entity);
	}

	function addProjectile(projectile: ReturnType<typeof createSphere>) {
		projectiles.add(projectile);
		projectile.onDestroy(() => {
			projectiles.delete(projectile);
		});
		stage.add(projectile);
	}

	function clearProjectiles(globals: Record<string, unknown>) {
		for (const projectile of [...projectiles]) {
			destroy(projectile, globals);
		}
	}

	function scheduleEntityCleanup(
		entity: { uuid: string },
		ttl = SHIP_FRAGMENT_TTL_SECONDS,
	) {
		pendingEntityCleanup.set(entity.uuid, { entity, ttl });
	}

	function tickEntityCleanup(delta: number, globals: Record<string, unknown>) {
		for (const [uuid, pending] of [...pendingEntityCleanup.entries()]) {
			pending.ttl -= delta;
			if (pending.ttl > 0) {
				continue;
			}

			destroy(pending.entity as any, globals);
			pendingEntityCleanup.delete(uuid);
		}
	}

	function syncPlayerShield(gameOver: boolean) {
		const playerPosition = getPlayerPosition();
		if (!playerPosition) {
			return;
		}

		player.shield.setPosition(playerPosition.x, playerPosition.y, playerPosition.z);
		player.shield.setPositionZ(playerPosition.z);
		setEntityVisibility(player.shield, playerDamageCooldown > 0 && !gameOver);
	}

	function showAnnouncement(text: string, duration = ANNOUNCEMENT_DURATION_SECONDS) {
		announcementTimer = duration;
		updateStatusHud(text, stage as any);
	}

	function tickAnnouncement(delta: number) {
		if (announcementTimer <= 0) {
			return;
		}

		announcementTimer = Math.max(0, announcementTimer - delta);
		if (announcementTimer <= 0) {
			updateStatusHud('', stage as any);
		}
	}

	function triggerPlayerDeath(impactWorld?: Vector3) {
		const playerPosition = getPlayerPosition();
		if (playerPosition) {
			effects.playPlayerDeath(playerPosition);
		}

		if (player.explode(impactWorld ?? playerPosition ?? undefined)) {
			scheduleEntityCleanup(player.entity, SHIP_FRAGMENT_TTL_SECONDS + 0.5);
		}

		setGlobal('gameOver', true);
	}

	function damagePlayer(
		amount: number,
		globals: Record<string, unknown>,
		impactWorld?: Vector3,
	) {
		if (Boolean(globals.gameOver) || playerDamageCooldown > 0) {
			return false;
		}

		const nextLives = Math.max(
			0,
			Number(globals.lives ?? PLAYER_MAX_LIVES) - amount,
		);
		setGlobal('lives', nextLives);
		playerDamageCooldown = PLAYER_DAMAGE_COOLDOWN_SECONDS;
		if (nextLives <= 0) {
			triggerPlayerDeath(impactWorld);
			return true;
		}

		return false;
	}

	function destroyEnemy(
		runtime: EnemyRuntime,
		globals: Record<string, unknown>,
		awardScore = true,
		allowWaveClear = true,
		impactWorld?: Vector3,
	) {
		if (!runtime.alive) {
			return false;
		}

		runtime.alive = false;
		if (awardScore) {
			setGlobal('score', Number(globals.score ?? 0) + ENEMY_SCORES[runtime.kind]);
		}
		const enemyPosition = getEntityPosition(runtime.entity) ?? runtime.anchor.clone();
		effects.playEnemyDeath(runtime.kind, enemyPosition);
		if (runtime.explode(impactWorld ?? enemyPosition)) {
			scheduleEntityCleanup(runtime.entity);
		} else {
			destroy(runtime.entity, globals);
		}

		if (
			allowWaveClear
			&& !Boolean(globals.gameOver)
			&& nextWaveTimer <= 0
			&& !enemyRuntimes.some((enemy) => enemy.alive)
		) {
			nextWaveTimer = WAVE_RESPAWN_DELAY_SECONDS;
			showAnnouncement('Wave Cleared', WAVE_RESPAWN_DELAY_SECONDS);
		}

		return true;
	}

	function createPlayerBullet(position: Vector3) {
		effects.playPlayerMuzzle(position, 0);
		const bullet = createSphere({
			name: '3d-space-invaders-player-bullet',
			radius: BULLET_RADIUS,
			position: { x: position.x, y: position.y, z: 0 },
			material: {
				color: new Color('#fde68a'),
			},
			collisionType: PLAYER_BULLET_COLLISION_TYPE,
			collisionFilter: [ENEMY_COLLISION_TYPE],
		});

		bullet.onSetup(({ me }: any) => {
			me.body?.setGravityScale(0, true);
			me.body?.setLinearDamping(0);
		});

		bullet.onUpdate(({ me, delta }: any) => {
			const current = getEntityPosition(me);
			if (!current) {
				return;
			}

			const nextPosition = current.add(
				new Vector3(0, PLAYER_BULLET_SPEED * delta, 0),
			);
			setWorldPosition(me, nextPosition);

			if (
				Math.abs(nextPosition.x) > BULLET_BOUNDS_X
				|| Math.abs(nextPosition.y) > BULLET_BOUNDS_Y
			) {
				destroy(me);
			}
		});

		bullet.onCollision(({ entity, other, globals }: any) => {
			const runtime = enemyRuntimeByUuid.get(other.uuid);
			if (!runtime || !runtime.alive) {
				return;
			}

			const hitPosition = getEntityPosition(entity);
			if (hitPosition) {
				effects.playImpact(hitPosition);
			}

			const destroyed = destroyEnemy(runtime, globals, true, true, hitPosition ?? undefined);
			if (destroyed) {
				destroy(entity, globals);
			}
		}, {
			phase: 'enter',
		});

		return bullet;
	}

	function createStraightEnemyBullet(position: Vector3, color: string) {
		effects.playEnemyMuzzle('charge', position, Math.PI);
		const bullet = createSphere({
			name: '3d-space-invaders-enemy-bullet',
			radius: BULLET_RADIUS,
			position: { x: position.x, y: position.y, z: 0 },
			material: {
				color: new Color(color),
			},
			collisionType: ENEMY_BULLET_COLLISION_TYPE,
			collisionFilter: [PLAYER_COLLISION_TYPE],
		});

		bullet.onSetup(({ me }: any) => {
			me.body?.setGravityScale(0, true);
			me.body?.setLinearDamping(0);
		});

		bullet.onUpdate(({ me, delta }: any) => {
			const current = getEntityPosition(me);
			if (!current) {
				return;
			}

			const nextPosition = current.add(
				new Vector3(0, -ENEMY_BULLET_SPEED * delta, 0),
			);
			setWorldPosition(me, nextPosition);

			if (
				Math.abs(nextPosition.x) > BULLET_BOUNDS_X
				|| Math.abs(nextPosition.y) > BULLET_BOUNDS_Y
			) {
				destroy(me);
			}
		});

		bullet.onCollision(({ entity, other, globals }: any) => {
			if (other.uuid !== player.entity.uuid) {
				return;
			}

			const hitPosition = getEntityPosition(entity);
			if (hitPosition) {
				effects.playImpact(hitPosition, Math.PI);
			}

			damagePlayer(1, globals, hitPosition ?? undefined);
			destroy(entity, globals);
		}, {
			phase: 'enter',
		});

		return bullet;
	}

	function createSineEnemyBullet(position: Vector3) {
		effects.playEnemyMuzzle('sine', position, Math.PI);
		const bullet = createSphere({
			name: '3d-space-invaders-sine-bullet',
			radius: BULLET_RADIUS,
			position: { x: position.x, y: position.y, z: 0 },
			material: {
				color: new Color(ENEMY_COLORS.sine),
			},
			collisionType: ENEMY_BULLET_COLLISION_TYPE,
			collisionFilter: [PLAYER_COLLISION_TYPE],
		});

		const origin = position.clone();
		const phase = Math.random() * Math.PI * 2;
		let elapsed = 0;

		bullet.onSetup(({ me }: any) => {
			me.body?.setGravityScale(0, true);
			me.body?.setLinearDamping(0);
		});

		bullet.onUpdate(({ me, delta }: any) => {
			elapsed += delta;
			const nextPosition = new Vector3(
				origin.x
					+ Math.sin(elapsed * SINE_BULLET_FREQUENCY + phase)
						* SINE_BULLET_AMPLITUDE,
				origin.y - ENEMY_BULLET_SPEED * elapsed,
				0,
			);
			setWorldPosition(me, nextPosition);

			if (
				Math.abs(nextPosition.x) > BULLET_BOUNDS_X
				|| Math.abs(nextPosition.y) > BULLET_BOUNDS_Y
			) {
				destroy(me);
			}
		});

		bullet.onCollision(({ entity, other, globals }: any) => {
			if (other.uuid !== player.entity.uuid) {
				return;
			}

			const hitPosition = getEntityPosition(entity);
			if (hitPosition) {
				effects.playImpact(hitPosition, Math.PI);
			}

			damagePlayer(1, globals, hitPosition ?? undefined);
			destroy(entity, globals);
		}, {
			phase: 'enter',
		});

		return bullet;
	}

	function registerEnemyRuntime(runtime: EnemyRuntime) {
		runtime.entity.onCollision(({ other, globals }: any) => {
			if (!runtime.alive || other.uuid !== player.entity.uuid) {
				return;
			}

			const impactWorld =
				getEntityPosition(runtime.entity)
				?? getPlayerPosition()
				?? runtime.anchor.clone();
			effects.playImpact(impactWorld);
			const didGameOver = damagePlayer(1, globals, impactWorld);
			destroyEnemy(runtime, globals, false, !didGameOver, impactWorld);
		}, {
			phase: 'enter',
		});

		runtime.entity.onDestroy(() => {
			enemyRuntimeByUuid.delete(runtime.entity.uuid);
			pendingEntityCleanup.delete(runtime.entity.uuid);
			enemyRuntimes = enemyRuntimes.filter((candidate) => candidate !== runtime);
		});

		enemyRuntimeByUuid.set(runtime.entity.uuid, runtime);
		enemyRuntimes.push(runtime);
		return runtime;
	}

	function createEnemyRuntime(
		kind: EnemyKind,
		anchor: Vector3,
		waveNumber: number,
		index: number,
	) {
		switch (kind) {
			case 'sine':
				return registerEnemyRuntime(
					createSnakeShipRuntime({ anchor, waveNumber, index }),
				);
			case 'circle':
				return registerEnemyRuntime(
					createVultureShipRuntime({ anchor, waveNumber, index }),
				);
			case 'charge':
				return registerEnemyRuntime(
					createCougarShipRuntime({ anchor, waveNumber, index }),
				);
			default:
				throw new Error(`Unhandled enemy kind: ${String(kind)}`);
		}
	}

	function spawnWave(waveNumber: number) {
		const rowOffsets: Record<EnemyKind, number> = {
			sine: 0,
			circle: 1.35,
			charge: -1.35,
		};
		const enemiesToAdd: EnemyRuntime['entity'][] = [];
		let index = 0;

		for (const kind of WAVE_KIND_ORDER) {
			for (const columnX of WAVE_COLUMNS) {
				const runtime = createEnemyRuntime(
					kind,
					new Vector3(columnX + rowOffsets[kind], WAVE_ROWS[kind], 0),
					waveNumber,
					index,
				);
				enemiesToAdd.push(runtime.entity);
				index += 1;
			}
		}

		stage.add(...enemiesToAdd);
	}

	function updateEnemy(runtime: EnemyRuntime, delta: number) {
		runtime.time += delta * runtime.difficulty;
		runtime.phaseTime += delta;

		const context = {
			delta,
			getPlayerPosition,
			addProjectile,
			createSineEnemyBullet,
			createStraightEnemyBullet,
		};

		switch (runtime.kind) {
			case 'sine':
				updateSnakeShip(runtime, context);
				return;
			case 'circle':
				updateVultureShip(runtime, context);
				return;
			case 'charge':
				updateCougarShip(runtime, context);
		}
	}

	function stopGameplay(globals: Record<string, unknown>) {
		nextWaveTimer = 0;
		shootCooldown = Number.POSITIVE_INFINITY;
		playerDamageCooldown = 0;
		clearProjectiles(globals);
		setEntityVisibility(player.shield, false);
	}

	const game = createGame(
		{
			id: '3d-space-invaders',
			debug: true,
			globals: {
				gameOver: false,
				lives: PLAYER_MAX_LIVES,
				score: 0,
				wave: 1,
			},
		},
		stage,
		hud.livesText,
		hud.waveText,
		hud.scoreText,
		hud.statusText,
		hud.gameOverText,
	).onUpdate(({ inputs, delta, globals }: any) => {
		tickEntityCleanup(delta, globals);

		if (Boolean(globals.gameOver)) {
			syncPlayerShield(true);
			return;
		}

		playerDamageCooldown = Math.max(0, playerDamageCooldown - delta);
		tickAnnouncement(delta);
		syncPlayerShield(false);

		if (nextWaveTimer > 0 && !enemyRuntimes.some((enemy) => enemy.alive)) {
			nextWaveTimer = Math.max(0, nextWaveTimer - delta);
			if (nextWaveTimer <= 0) {
				const nextWave = Number(globals.wave ?? 1) + 1;
				spawnWave(nextWave);
				setGlobal('wave', nextWave);
				showAnnouncement(`Wave ${nextWave}`);
			}
		}

		const horizontalInput = clamp(inputs.p1.axes.Horizontal.value, -1, 1);
		const playerPosition = getPlayerPosition();
		if (playerPosition) {
			const nextX = clamp(
				playerPosition.x + horizontalInput * PLAYER_SPEED * delta,
				-PLAYER_BOUNDS_X,
				PLAYER_BOUNDS_X,
			);
			setWorldPosition(player.entity, new Vector3(nextX, PLAYER_START_Y, 0));
		}

		shootCooldown = Math.max(0, shootCooldown - delta);
		if (
			(inputs.p1.buttons.A.pressed || inputs.p1.buttons.A.held > 0)
			&& shootCooldown <= 0
		) {
			const latestPlayerPosition = getPlayerPosition();
			if (latestPlayerPosition) {
				addProjectile(
					createPlayerBullet(
						latestPlayerPosition.clone().add(new Vector3(0, 1.15, 0)),
					),
				);
				shootCooldown = PLAYER_SHOOT_COOLDOWN_SECONDS;
			}
		}

		for (const runtime of [...enemyRuntimes]) {
			if (!runtime.alive) {
				continue;
			}

			updateEnemy(runtime, delta);
		}
	})
		.onGlobalChange<number>('score', (score: number, currentStage: any) => {
			updateScoreHud(score, currentStage as any);
		})
		.onGlobalChange<number>('lives', (lives: number, currentStage: any) => {
			updateLivesHud(lives, currentStage as any);
			if (Math.max(0, lives) <= 0) {
				setGlobal('gameOver', true);
			}
		})
		.onGlobalChange<number>('wave', (wave: number, currentStage: any) => {
			updateWaveHud(wave, currentStage as any);
		})
		.onGlobalChange<boolean>('gameOver', (gameOver: boolean, currentStage: any) => {
			updateGameOverHud(gameOver, currentStage as any);
			if (gameOver) {
				updateStatusHud('', currentStage as any);
				stopGameplay({ gameOver: true });
			}
		});

	spawnWave(1);
	showAnnouncement('Wave 1');

	return game;
}
