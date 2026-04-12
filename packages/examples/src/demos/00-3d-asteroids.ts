import {
	AmbientLight,
	DirectionalLight,
	HemisphereLight,
	Vector3,
} from 'three';
import {
	createCamera,
	createGame,
	createStage,
	setGlobal,
	useArrowsForAxes,
	useWASDForAxes,
} from '@zylem/game-lib';
import { createAsteroidField } from './3d-asteroids/asteroid';
import {
	createAsteroidHud,
	updateGameOverHud,
	updateHealthHud,
	updateScoreHud,
} from './3d-asteroids/hud';
import {
	alignParticleSystem,
	createAsteroidParticles,
} from './3d-asteroids/particles';
import {
	createProjectile,
	createShip,
	orientShipModel,
	setEntityVisibility,
} from './3d-asteroids/ship';
import {
	BULLET_SPEED,
	PLAYER_COLLISION_DAMAGE,
	PLAYER_DAMAGE_COOLDOWN_SECONDS,
	PLAYER_MAX_HEALTH,
	SHIP_ACCELERATION,
	SHIP_BRAKE,
	SHIP_DRAG,
	SHIP_MAX_SPEED,
	SHIP_TURN_SPEED,
	SHOOT_COOLDOWN_SECONDS,
	clampVectorLength,
	getForwardDirection,
	getRightDirection,
} from './3d-asteroids/shared';
import { starfieldShader } from './planet-demo/starfield.shader';

const GAME_OVER_HUD_DELAY_SECONDS = 0.45;

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 0, z: 13.5 },
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

	stage.onSetup(({ stage: activeStage }) => {
		const scene = (activeStage as any)?.wrappedStage?.scene?.scene;
		if (!scene) {
			return;
		}

		if (!scene.getObjectByName('asteroids-fill-ambient')) {
			const ambient = new AmbientLight('#dbeafe', 1.8);
			ambient.name = 'asteroids-fill-ambient';
			scene.add(ambient);
		}

		if (!scene.getObjectByName('asteroids-fill-hemi')) {
			const hemi = new HemisphereLight('#e0f2fe', '#0f172a', 1.5);
			hemi.name = 'asteroids-fill-hemi';
			hemi.position.set(0, 0, 18);
			scene.add(hemi);
		}

		if (!scene.getObjectByName('asteroids-rim-light')) {
			const rim = new DirectionalLight('#93c5fd', 2.6);
			rim.name = 'asteroids-rim-light';
			rim.position.set(-12, 6, 18);
			scene.add(rim);
		}
	});

	const hud = createAsteroidHud();
	const ship = createShip();
	const {
		thrusterParticles,
		muzzleFlash,
		impactBurst,
		shipDeathBurst,
	} = createAsteroidParticles();
	const asteroidField = createAsteroidField({
		getPlayerPosition: () => {
			const position = ship.entity.getPosition();
			return position
				? new Vector3(position.x, position.y, position.z ?? 0)
				: null;
		},
		onImpact: (position) => {
			alignParticleSystem(impactBurst, position, 0);
			impactBurst.restart();
		},
	});

	let elapsedSeconds = 0;
	let shipAngle = 0;
	const shipVelocity = new Vector3();
	let shootCooldown = 0;
	let playerDamageCooldown = 0;
	let gameOverHudDelay = 0;
	let gameOverHudShown = false;

	function stopGameplay() {
		shipVelocity.set(0, 0, 0);
		shootCooldown = Number.POSITIVE_INFINITY;
		playerDamageCooldown = Number.POSITIVE_INFINITY;
		thrusterParticles.stop();
		muzzleFlash.stop();
		impactBurst.stop();
		setEntityVisibility(ship.shield, false);
		ship.entity.body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
		ship.entity.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
		asteroidField.deactivateAll();
	}

	function triggerShipDeath(shipPosition: Vector3) {
		alignParticleSystem(shipDeathBurst, shipPosition, 0);
		shipDeathBurst.restart();
		ship.explode(shipPosition);
	}

	function triggerMuzzleFlash(shipPosition: Vector3, facingAngle: number) {
		const muzzlePosition = shipPosition
			.clone()
			.add(getForwardDirection(facingAngle).multiplyScalar(1.35));
		alignParticleSystem(muzzleFlash, muzzlePosition, facingAngle);
		muzzleFlash.restart();
	}

	ship.entity.onCollision(({ other, globals }) => {
		if (Boolean(globals.gameOver) || playerDamageCooldown > 0) {
			return;
		}

		const shipPosition = ship.entity.getPosition();
		if (!shipPosition) {
			return;
		}

		const didHitAsteroid = asteroidField.handleHitByUuid(
			other.uuid,
			new Vector3(shipPosition.x, shipPosition.y, shipPosition.z ?? 0),
			globals,
		);
		if (!didHitAsteroid) {
			return;
		}

		const nextHealth = Math.max(
			0,
			Number(globals.health ?? PLAYER_MAX_HEALTH) - PLAYER_COLLISION_DAMAGE,
		);
		setGlobal('health', nextHealth);
		playerDamageCooldown = PLAYER_DAMAGE_COOLDOWN_SECONDS;
	}, {
		phase: 'enter',
	});

	stage.add(
		ship.entity,
		ship.shield,
		thrusterParticles,
		muzzleFlash,
		impactBurst,
		shipDeathBurst,
		hud.healthBarFrame,
		hud.healthBarFill,
		hud.healthLabel,
		...asteroidField.entities,
	);

	const game = createGame(
		{
			id: '3d-asteroids',
			debug: true,
			globals: {
				gameOver: false,
				health: PLAYER_MAX_HEALTH,
				score: 0,
			},
		},
		stage,
		hud.gameOverText,
		hud.scoreText,
	).onUpdate(({ inputs, delta, globals }) => {
		orientShipModel(ship.entity);
		if (Boolean(globals.gameOver)) {
			if (!gameOverHudShown) {
				gameOverHudDelay = Math.max(0, gameOverHudDelay - delta);
				if (gameOverHudDelay <= 0) {
					updateGameOverHud(true, stage as any);
					gameOverHudShown = true;
				}
			}
			return;
		}

		playerDamageCooldown = Math.max(0, playerDamageCooldown - delta);
		elapsedSeconds += delta;
		asteroidField.tick(delta, elapsedSeconds);

		const { p1 } = inputs;
		const turnInput = -p1.axes.Horizontal.value;
		const thrustInput = Math.max(0, -p1.axes.Vertical.value);
		const brakeInput = Math.max(0, p1.axes.Vertical.value);

		shipAngle += turnInput * SHIP_TURN_SPEED * delta;

		if (thrustInput > 0) {
			const forward = getForwardDirection(shipAngle);
			shipVelocity.addScaledVector(forward, thrustInput * SHIP_ACCELERATION * delta);
		}

		if (brakeInput > 0) {
			const brakeFactor = Math.max(0.55, 1 - brakeInput * SHIP_BRAKE * delta);
			shipVelocity.multiplyScalar(brakeFactor);
		} else {
			shipVelocity.multiplyScalar(Math.pow(SHIP_DRAG, delta * 60));
		}

		clampVectorLength(shipVelocity, SHIP_MAX_SPEED);

		ship.entity.moveXY(shipVelocity.x, shipVelocity.y);
		ship.entity.setRotation(0, 0, shipAngle);
		ship.entity.setPositionZ(0);

		const shipPosition = ship.entity.getPosition();
		if (!shipPosition) {
			return;
		}

		const shipWorldPosition = new Vector3(shipPosition.x, shipPosition.y, shipPosition.z ?? 0);
		ship.shield.setPosition(shipWorldPosition.x, shipWorldPosition.y, shipWorldPosition.z);
		ship.shield.setPositionZ(shipWorldPosition.z);
		setEntityVisibility(ship.shield, playerDamageCooldown > 0);
		const thrusterPosition = shipWorldPosition
			.clone()
			.sub(getForwardDirection(shipAngle).multiplyScalar(0.92))
			.add(getRightDirection(shipAngle).multiplyScalar(0.02));
		alignParticleSystem(thrusterParticles, thrusterPosition, shipAngle + Math.PI);

		if (thrustInput > 0.05) {
			if (!thrusterParticles.isPlaying()) {
				thrusterParticles.play();
			}
		} else if (thrusterParticles.isPlaying()) {
			thrusterParticles.stop();
		}

		shootCooldown = Math.max(0, shootCooldown - delta);
		if ((p1.buttons.A.pressed || p1.buttons.A.held > 0) && shootCooldown <= 0) {
			const bulletSpawn = shipWorldPosition
				.clone()
				.add(getForwardDirection(shipAngle).multiplyScalar(1.55));
			const bulletVelocity = getForwardDirection(shipAngle)
				.multiplyScalar(BULLET_SPEED)
				.add(shipVelocity.clone().multiplyScalar(0.35));
			const bullet = createProjectile(
				bulletSpawn,
				bulletVelocity,
				ship.entity.uuid,
				(otherUuid, hitPosition, projectileGlobals) => {
					return asteroidField.handleHitByUuid(otherUuid, hitPosition, projectileGlobals);
				},
			);
			stage.add(bullet);
			triggerMuzzleFlash(shipWorldPosition, shipAngle);
			shootCooldown = SHOOT_COOLDOWN_SECONDS;
		}
	})
		.onGlobalChange<number>('score', (score, currentStage) => {
			updateScoreHud(score, currentStage as any);
		})
		.onGlobalChange<number>('health', (health, currentStage) => {
			updateHealthHud(health, currentStage as any);
			if (Math.max(0, Math.min(PLAYER_MAX_HEALTH, health)) <= 0) {
				setGlobal('gameOver', true);
			}
		})
		.onGlobalChange<boolean>('gameOver', (gameOver, currentStage) => {
			updateGameOverHud(false, currentStage as any);
			if (gameOver) {
				gameOverHudDelay = GAME_OVER_HUD_DELAY_SECONDS;
				gameOverHudShown = false;
				const shipPosition = ship.entity.getPosition();
				if (shipPosition) {
					triggerShipDeath(
						new Vector3(shipPosition.x, shipPosition.y, shipPosition.z ?? 0),
					);
				}
				stopGameplay();
			} else {
				gameOverHudDelay = 0;
				gameOverHudShown = false;
			}
		});

	return game;
}
