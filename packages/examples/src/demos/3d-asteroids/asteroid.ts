import { Matrix4, Vector3 } from 'three';
import {
	createActor,
	Destructible3DBehavior,
	FractureOptions,
	ScreenWrapBehavior,
	setGlobal,
	type Destructible3DHandle,
} from '@zylem/game-lib';
import redAsteroidGlb from '../../assets/red-asteroid.glb';
import { destructiblePrebakeWorkerUrl } from '../lib/destructible-prebake-worker-url';
import {
	ASTEROID_TARGET_SMALL_SHARE,
	type AsteroidSize,
	ASTEROID_FRAGMENT_TTL_SECONDS,
	LARGE_ASTEROID_FRAGMENT_COUNT,
	LARGE_ASTEROID_POOL_SIZE,
	LARGE_ASTEROID_SCALE,
	MAX_ACTIVE_ASTEROIDS,
	OFFSCREEN_SPAWN_MARGIN,
	PLAYFIELD_HEIGHT,
	PLAYFIELD_WIDTH,
	PLAYER_ASTEROID_SPAWN_SAFE_DISTANCE,
	SMALL_ASTEROID_FRAGMENT_COUNT,
	SMALL_ASTEROID_POOL_SIZE,
	SMALL_ASTEROID_SCALE,
	WRAP_HEIGHT,
	WRAP_WIDTH,
	getAsteroidSpeed,
	getFirstMesh,
	getRespawnDelayForElapsed,
	randomDirection,
	randomRespawnDelay,
	rotateVector2,
} from './shared';

type CleanupEntry = {
	runtime: AsteroidRuntime;
	ttl: number;
};

type PendingSplitSpawn = {
	position: Vector3;
	baseVelocity: Vector3;
};

type ActiveAsteroidCounts = Record<AsteroidSize, number>;

export type AsteroidRuntime = {
	entity: ReturnType<typeof createActor>;
	destructible: Destructible3DHandle;
	size: AsteroidSize;
	spawnPosition: Vector3;
	velocity: Vector3;
	spin: Vector3;
	active: boolean;
	cleanupScheduled: boolean;
	inPool: boolean;
	warmedUp: boolean;
};

type AsteroidFieldOptions = {
	getPlayerPosition: () => Vector3 | null;
	onImpact: (position: Vector3) => void;
};

const ORIGIN_SPAWN_SAFE_DISTANCE = 1.5;
const ASTEROID_COLLISION_PADDING = 0.18;
const ASTEROID_COLLISION_MIN_SPEED = 0.2;

function getAsteroidCollisionRadius(size: AsteroidSize) {
	return size === 'large' ? 1.7 : 0.95;
}

export function createAsteroidField({
	getPlayerPosition,
	onImpact,
}: AsteroidFieldOptions) {
	const inverseMatrix = new Matrix4();
	const asteroidRuntimeById = new Map<string, AsteroidRuntime>();
	const cleanupQueue: CleanupEntry[] = [];
	const pendingSplitSpawns: PendingSplitSpawn[] = [];
	const availableAsteroidPool = {
		large: [] as AsteroidRuntime[],
		small: [] as AsteroidRuntime[],
	};

	let asteroidCounter = 0;
	let asteroidRespawnTimer = randomRespawnDelay();

	function sanitizeSpawnPosition(position: Vector3, fallbackVelocity?: Vector3) {
		if (position.lengthSq() > ORIGIN_SPAWN_SAFE_DISTANCE * ORIGIN_SPAWN_SAFE_DISTANCE) {
			return position;
		}

		const fallbackDirection = fallbackVelocity && fallbackVelocity.lengthSq() > 0.0001
			? fallbackVelocity.clone().normalize()
			: randomDirection(1).normalize();
		return fallbackDirection.multiplyScalar(ORIGIN_SPAWN_SAFE_DISTANCE);
	}

	function setAsteroidVisibility(entity: ReturnType<typeof createActor>, visible: boolean) {
		if (entity.group) {
			entity.group.visible = visible;
		}
		if (entity.mesh) {
			entity.mesh.visible = visible;
		}
	}

	function getRuntimePosition(runtime: AsteroidRuntime) {
		const position = runtime.entity.getPosition();
		if (position) {
			return new Vector3(position.x, position.y, position.z ?? 0);
		}

		return runtime.spawnPosition.clone();
	}

	function syncRuntimePosition(runtime: AsteroidRuntime, position: Vector3) {
		runtime.entity.setPosition(position.x, position.y, position.z);
		runtime.entity.body?.setTranslation(
			{ x: position.x, y: position.y, z: position.z },
			true,
		);
		runtime.entity.setPositionZ(position.z);
	}

	function parkAsteroid(runtime: AsteroidRuntime) {
		runtime.spawnPosition.set(0, 0, 1000);
		syncRuntimePosition(runtime, runtime.spawnPosition);
		runtime.entity.body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
		runtime.entity.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
		setAsteroidVisibility(runtime.entity, false);
	}

	function deactivateAsteroid(runtime: AsteroidRuntime) {
		runtime.active = false;
		runtime.cleanupScheduled = false;
		runtime.velocity.set(0, 0, 0);
		runtime.spin.set(0, 0, 0);
		runtime.destructible.repair();
		parkAsteroid(runtime);
	}

	function returnAsteroidToPool(runtime: AsteroidRuntime) {
		if (runtime.inPool || runtime.active || runtime.cleanupScheduled) {
			return;
		}

		availableAsteroidPool[runtime.size].push(runtime);
		runtime.inPool = true;
	}

	function takeAsteroidFromPool(size: AsteroidSize) {
		const runtime = availableAsteroidPool[size].pop() ?? null;
		if (runtime) {
			runtime.inPool = false;
		}
		return runtime;
	}

	function activateAsteroid(
		runtime: AsteroidRuntime,
		position: Vector3,
		velocity: Vector3,
	) {
		const spawnPosition = sanitizeSpawnPosition(position.clone(), velocity);
		runtime.active = true;
		runtime.cleanupScheduled = false;
		runtime.inPool = false;
		runtime.spawnPosition.copy(spawnPosition);
		runtime.velocity.copy(velocity);
		runtime.spin.set(
			(Math.random() - 0.5) * 0.65,
			(Math.random() - 0.5) * 0.65,
			(Math.random() - 0.5) * 1.15,
		);
		runtime.destructible.repair();
		setAsteroidVisibility(runtime.entity, true);
		syncRuntimePosition(runtime, new Vector3(spawnPosition.x, spawnPosition.y, 0));
		runtime.entity.body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
		runtime.entity.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
		runtime.entity.setRotation(
			Math.random() * Math.PI,
			Math.random() * Math.PI,
			Math.random() * Math.PI,
		);
	}

	function scheduleCleanup(runtime: AsteroidRuntime, ttl: number) {
		cleanupQueue.push({ runtime, ttl });
	}

	function getActiveAsteroidCount() {
		let count = 0;
		for (const runtime of asteroidRuntimeById.values()) {
			if (runtime.active) {
				count += 1;
			}
		}
		return count;
	}

	function getActiveAsteroidCounts(): ActiveAsteroidCounts {
		const counts: ActiveAsteroidCounts = {
			large: 0,
			small: 0,
		};

		for (const runtime of asteroidRuntimeById.values()) {
			if (runtime.active) {
				counts[runtime.size] += 1;
			}
		}

		return counts;
	}

	function getDesiredSmallCount(totalAsteroids: number) {
		if (totalAsteroids <= 1) {
			return 0;
		}

		const target = totalAsteroids === 2
			? 1
			: Math.max(2, Math.round(totalAsteroids * ASTEROID_TARGET_SMALL_SHARE));
		return Math.min(totalAsteroids - 1, target);
	}

	function chooseRandomSpawnSize() {
		const hasLargeAvailable = availableAsteroidPool.large.length > 0;
		const hasSmallAvailable = availableAsteroidPool.small.length > 0;
		if (!hasLargeAvailable && !hasSmallAvailable) {
			return null;
		}

		if (!hasLargeAvailable) {
			return 'small';
		}

		if (!hasSmallAvailable) {
			return 'large';
		}

		const activeCounts = getActiveAsteroidCounts();
		const nextTotal = activeCounts.large + activeCounts.small + 1;
		const desiredSmallCount = getDesiredSmallCount(nextTotal);
		const desiredLargeCount = nextTotal - desiredSmallCount;

		if (activeCounts.small < desiredSmallCount) {
			return 'small';
		}

		if (activeCounts.large < desiredLargeCount) {
			return 'large';
		}

		return Math.random() < ASTEROID_TARGET_SMALL_SHARE ? 'small' : 'large';
	}

	function warmupDestructible(runtime: AsteroidRuntime) {
		if (runtime.warmedUp || !runtime.entity.mesh) {
			return;
		}

		// Worker prebake keeps Voronoi off the main thread; game-lib dedupes concurrent
		// prebakeAsync calls on the same asteroid behavior handle.
		void runtime.destructible.prebakeAsync().then(
			() => {
				runtime.warmedUp = true;
			},
			(error) => {
				console.warn('Failed to warm destructible asteroid', error);
			},
		);
	}

	function isAsteroidReady(runtime: AsteroidRuntime) {
		return Boolean(runtime.entity.mesh?.geometry);
	}

	function buildAsteroidFractureOptions(size: AsteroidSize) {
		return new FractureOptions({
			fractureMethod: 'voronoi',
			fragmentCount:
				size === 'large'
					? LARGE_ASTEROID_FRAGMENT_COUNT
					: SMALL_ASTEROID_FRAGMENT_COUNT,
			voronoiOptions: {
				mode: '3D',
			},
			seed: size === 'large' ? 17 : 29,
		});
	}

	function buildImpactOverride(
		runtime: AsteroidRuntime,
		impactWorld: Vector3,
	) {
		const targetRoot = runtime.entity.mesh ?? runtime.entity.group;
		if (!targetRoot) {
			return undefined;
		}

		targetRoot.updateMatrixWorld(true);
		const impactPoint = impactWorld.clone().applyMatrix4(
			inverseMatrix.copy(targetRoot.matrixWorld).invert(),
		);

		return {
			fractureMethod: 'voronoi' as const,
			fragmentCount:
				runtime.size === 'large'
					? LARGE_ASTEROID_FRAGMENT_COUNT
					: SMALL_ASTEROID_FRAGMENT_COUNT,
			voronoiOptions: {
				mode: '3D' as const,
				impactPoint,
				impactRadius: runtime.size === 'large' ? 0.72 : 0.48,
			},
		};
	}

	function bounceAsteroidPair(runtime: AsteroidRuntime, otherRuntime: AsteroidRuntime) {
		if (
			!runtime.active
			|| !otherRuntime.active
			|| runtime.cleanupScheduled
			|| otherRuntime.cleanupScheduled
			|| runtime.entity.uuid > otherRuntime.entity.uuid
		) {
			return;
		}

		const runtimePosition = getRuntimePosition(runtime);
		const otherPosition = getRuntimePosition(otherRuntime);
		const collisionNormal = otherPosition.clone().sub(runtimePosition);

		if (collisionNormal.lengthSq() <= 0.0001) {
			collisionNormal.copy(otherRuntime.velocity).sub(runtime.velocity);
		}

		if (collisionNormal.lengthSq() <= 0.0001) {
			collisionNormal.copy(randomDirection(1));
		}

		collisionNormal.normalize();

		const runtimeNormalSpeed = runtime.velocity.dot(collisionNormal);
		const otherNormalSpeed = otherRuntime.velocity.dot(collisionNormal);
		const closingSpeed = runtimeNormalSpeed - otherNormalSpeed;

		if (closingSpeed <= 0) {
			return;
		}

		const runtimeNormalVelocity = collisionNormal
			.clone()
			.multiplyScalar(runtimeNormalSpeed);
		const otherNormalVelocity = collisionNormal
			.clone()
			.multiplyScalar(otherNormalSpeed);
		const runtimeTangentialVelocity = runtime.velocity
			.clone()
			.sub(runtimeNormalVelocity);
		const otherTangentialVelocity = otherRuntime.velocity
			.clone()
			.sub(otherNormalVelocity);

		runtime.velocity
			.copy(runtimeTangentialVelocity)
			.add(otherNormalVelocity);
		otherRuntime.velocity
			.copy(otherTangentialVelocity)
			.add(runtimeNormalVelocity);

		if (runtime.velocity.lengthSq() < ASTEROID_COLLISION_MIN_SPEED ** 2) {
			runtime.velocity.copy(collisionNormal).multiplyScalar(-ASTEROID_COLLISION_MIN_SPEED);
		}

		if (otherRuntime.velocity.lengthSq() < ASTEROID_COLLISION_MIN_SPEED ** 2) {
			otherRuntime.velocity.copy(collisionNormal).multiplyScalar(ASTEROID_COLLISION_MIN_SPEED);
		}

		const minimumDistance = getAsteroidCollisionRadius(runtime.size)
			+ getAsteroidCollisionRadius(otherRuntime.size)
			+ ASTEROID_COLLISION_PADDING;
		const currentDistance = runtimePosition.distanceTo(otherPosition);
		const separationDistance = currentDistance < minimumDistance
			? (minimumDistance - currentDistance) * 0.5
			: ASTEROID_COLLISION_PADDING * 0.5;

		runtimePosition.addScaledVector(collisionNormal, -separationDistance);
		otherPosition.addScaledVector(collisionNormal, separationDistance);
		syncRuntimePosition(runtime, runtimePosition);
		syncRuntimePosition(otherRuntime, otherPosition);
	}

	function createAsteroid(
		position: Vector3,
		size: AsteroidSize,
		velocity = randomDirection(size === 'large' ? 1.8 : 2.5),
	) {
		const scale = size === 'large' ? LARGE_ASTEROID_SCALE : SMALL_ASTEROID_SCALE;
		const collisionSize = size === 'large'
			? { x: 1.8, y: 1.8, z: 1.8 }
			: { x: 0.88, y: 0.88, z: 0.88 };

		const asteroid = createActor({
			name: `3d-asteroid-${size}-${asteroidCounter += 1}`,
			models: [redAsteroidGlb],
			scale: { x: scale, y: scale, z: scale },
			collisionShape: 'bounds',
			collision: {
				size: collisionSize,
			},
			position: { x: position.x, y: position.y, z: 0 },
		});

		asteroid.use(ScreenWrapBehavior, {
			width: WRAP_WIDTH,
			height: WRAP_HEIGHT,
		});

		const destructible = asteroid.use(Destructible3DBehavior, {
			fractureOptions: buildAsteroidFractureOptions(size),
			prebakeWorkerUrl: destructiblePrebakeWorkerUrl,
			collider: {
				shape: 'cuboid',
			},
			fragmentPhysics: {
				mode: 'independent',
				outwardVelocity: size === 'large' ? 2.6 : 1.8,
				angularVelocity: size === 'large' ? 1.2 : 0.8,
			},
		});

		const runtime: AsteroidRuntime = {
			entity: asteroid,
			destructible,
			size,
			spawnPosition: position.clone(),
			velocity: velocity.clone(),
			spin: new Vector3(
				(Math.random() - 0.5) * 0.65,
				(Math.random() - 0.5) * 0.65,
				(Math.random() - 0.5) * 1.15,
			),
			active: false,
			cleanupScheduled: false,
			inPool: false,
			warmedUp: false,
		};

		asteroidRuntimeById.set(asteroid.uuid, runtime);
		returnAsteroidToPool(runtime);

		const bindPrimaryMesh = () => {
			const primaryMesh = getFirstMesh(asteroid.group);
			if (primaryMesh) {
				asteroid.mesh = primaryMesh;
				warmupDestructible(runtime);
			}
		};

		asteroid.onSetup(({ me }) => {
			me.body?.setGravityScale(0, true);
			me.body?.setLinearDamping(0);
			bindPrimaryMesh();
			if (runtime.active) {
				me.setPosition(runtime.spawnPosition.x, runtime.spawnPosition.y, 0);
				me.body?.setTranslation({
					x: runtime.spawnPosition.x,
					y: runtime.spawnPosition.y,
					z: 0,
				}, true);
				me.body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
				me.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
				me.setRotation(
					Math.random() * Math.PI,
					Math.random() * Math.PI,
					Math.random() * Math.PI,
				);
			} else {
				parkAsteroid(runtime);
			}
		});

		asteroid.listen('entity:model:loaded', () => {
			bindPrimaryMesh();
		});

		asteroid.onCollision(({ other }) => {
			const otherRuntime = asteroidRuntimeById.get(other.uuid);
			if (!otherRuntime) {
				return;
			}

			bounceAsteroidPair(runtime, otherRuntime);
		}, {
			phase: 'enter',
		});

		asteroid.onUpdate(({ me, delta }) => {
			if (!runtime.active) {
				return;
			}

			me.moveXY(runtime.velocity.x, runtime.velocity.y);
			me.rotateX(runtime.spin.x * delta);
			me.rotateY(runtime.spin.y * delta);
			me.rotateZ(runtime.spin.z * delta);
			me.setPositionZ(0);
		});

		asteroid.onCleanup(() => {
			asteroidRuntimeById.delete(asteroid.uuid);
		});

		return runtime;
	}

	function spawnSplitAsteroids(position: Vector3, baseVelocity: Vector3) {
		const availableSlots = Math.max(0, MAX_ACTIVE_ASTEROIDS - getActiveAsteroidCount());
		const spawnCount = Math.min(2, availableSlots);
		if (spawnCount <= 0) {
			return;
		}

		const splitOffset =
			new Vector3(-baseVelocity.y, baseVelocity.x, 0).normalize().multiplyScalar(0.85);
		const leftVelocity = rotateVector2(baseVelocity.clone().multiplyScalar(1.28), 0.55);
		const rightVelocity = rotateVector2(baseVelocity.clone().multiplyScalar(1.28), -0.55);

		const left = takeAsteroidFromPool('small');
		if (left) {
			activateAsteroid(left, position.clone().add(splitOffset), leftVelocity);
		}

		if (spawnCount > 1) {
			const right = takeAsteroidFromPool('small');
			if (right) {
				activateAsteroid(right, position.clone().sub(splitOffset), rightVelocity);
			}
		}
	}

	function spawnRandomAsteroid(elapsedSeconds: number) {
		if (getActiveAsteroidCount() >= MAX_ACTIVE_ASTEROIDS) {
			return;
		}

		const visibleHalfWidth = PLAYFIELD_WIDTH * 0.5;
		const visibleHalfHeight = PLAYFIELD_HEIGHT * 0.5;
		const wrapHalfWidth = WRAP_WIDTH * 0.5;
		const wrapHalfHeight = WRAP_HEIGHT * 0.5;
		const edgeBandX = visibleHalfWidth + OFFSCREEN_SPAWN_MARGIN;
		const edgeBandY = visibleHalfHeight + OFFSCREEN_SPAWN_MARGIN;
		const cornerX = wrapHalfWidth - 0.5;
		const cornerY = wrapHalfHeight - 0.5;
		const edgeCandidates = [
			new Vector3(0, -edgeBandY, 0),
			new Vector3(cornerX * 0.7, -edgeBandY, 0),
			new Vector3(-cornerX * 0.7, -edgeBandY, 0),
			new Vector3(0, edgeBandY, 0),
			new Vector3(cornerX * 0.7, edgeBandY, 0),
			new Vector3(-cornerX * 0.7, edgeBandY, 0),
			new Vector3(-edgeBandX, 0, 0),
			new Vector3(-edgeBandX, cornerY * 0.7, 0),
			new Vector3(-edgeBandX, -cornerY * 0.7, 0),
			new Vector3(edgeBandX, 0, 0),
			new Vector3(edgeBandX, cornerY * 0.7, 0),
			new Vector3(edgeBandX, -cornerY * 0.7, 0),
			new Vector3(-cornerX, -cornerY, 0),
			new Vector3(cornerX, -cornerY, 0),
			new Vector3(-cornerX, cornerY, 0),
			new Vector3(cornerX, cornerY, 0),
		];

		const playerPosition = getPlayerPosition();
		const validCandidates = edgeCandidates.filter((candidate) =>
			!playerPosition
			|| candidate.distanceTo(playerPosition) >= PLAYER_ASTEROID_SPAWN_SAFE_DISTANCE,
		);
		const candidatePool = validCandidates.length > 0 ? validCandidates : edgeCandidates;
		const position = candidatePool[Math.floor(Math.random() * candidatePool.length)]!.clone();
		const size = chooseRandomSpawnSize();
		if (!size) {
			return;
		}

		const velocity = new Vector3(-position.x, -position.y, 0)
			.normalize()
			.multiplyScalar(getAsteroidSpeed(size, elapsedSeconds));
		const asteroid = takeAsteroidFromPool(size);
		if (!asteroid) {
			return;
		}
		activateAsteroid(asteroid, position, velocity);
	}

	function handleAsteroidHit(
		runtime: AsteroidRuntime,
		impactWorld: Vector3,
		globals: Record<string, unknown>,
	) {
		if (!runtime.active || !isAsteroidReady(runtime)) {
			return false;
		}

		runtime.active = false;
		runtime.destructible.fracture(buildImpactOverride(runtime, impactWorld));
		onImpact(impactWorld);

		if (runtime.size === 'large') {
			const origin = runtime.entity.getPosition();
			if (origin) {
				pendingSplitSpawns.push({
					position: new Vector3(origin.x, origin.y, 0),
					baseVelocity:
						runtime.velocity.lengthSq() > 0.0001
							? runtime.velocity.clone()
							: randomDirection(2.2),
				});
			}
			setGlobal('score', Number(globals.score ?? 0) + 25);
		} else {
			setGlobal('score', Number(globals.score ?? 0) + 75);
		}

		if (!runtime.cleanupScheduled) {
			runtime.cleanupScheduled = true;
			scheduleCleanup(runtime, ASTEROID_FRAGMENT_TTL_SECONDS);
		}

		return true;
	}

	const largeAsteroidPool = Array.from({ length: LARGE_ASTEROID_POOL_SIZE }, () =>
		createAsteroid(new Vector3(0, 0, 1000), 'large', new Vector3()),
	);
	const smallAsteroidPool = Array.from({ length: SMALL_ASTEROID_POOL_SIZE }, () =>
		createAsteroid(new Vector3(0, 0, 1000), 'small', new Vector3()),
	);

	const initialLargeAsteroids = [
		{
			position: new Vector3(-10, 6, 0),
			velocity: new Vector3(1.45, -0.95, 0),
		},
		{
			position: new Vector3(8, 7.5, 0),
			velocity: new Vector3(-1.25, -1.15, 0),
		},
		{
			position: new Vector3(11, -6.5, 0),
			velocity: new Vector3(-1.55, 0.82, 0),
		},
		{
			position: new Vector3(-7.5, -7, 0),
			velocity: new Vector3(1.1, 1.35, 0),
		},
	] as const;
	const initialSmallAsteroids = [
		{
			position: new Vector3(-12.5, -1.5, 0),
			velocity: new Vector3(2.4, 0.95, 0),
		},
		{
			position: new Vector3(12.5, 2.25, 0),
			velocity: new Vector3(-2.3, -1.1, 0),
		},
	] as const;
	for (const initial of initialLargeAsteroids) {
		const runtime = takeAsteroidFromPool('large');
		if (!runtime) {
			break;
		}

		activateAsteroid(runtime, initial.position, initial.velocity);
	}
	for (const initial of initialSmallAsteroids) {
		const runtime = takeAsteroidFromPool('small');
		if (!runtime) {
			break;
		}

		activateAsteroid(runtime, initial.position, initial.velocity);
	}

	return {
		entities: [
			...largeAsteroidPool.map((runtime) => runtime.entity),
			...smallAsteroidPool.map((runtime) => runtime.entity),
		],
		handleHitByUuid(otherUuid: string, impactWorld: Vector3, globals: Record<string, unknown>) {
			const runtime = asteroidRuntimeById.get(otherUuid);
			if (!runtime) {
				return false;
			}
			return handleAsteroidHit(runtime, impactWorld, globals);
		},
		tick(delta: number, elapsedSeconds: number) {
			while (pendingSplitSpawns.length > 0) {
				const next = pendingSplitSpawns.shift();
				if (!next) {
					break;
				}
				spawnSplitAsteroids(next.position, next.baseVelocity);
			}

			if (getActiveAsteroidCount() >= MAX_ACTIVE_ASTEROIDS) {
				asteroidRespawnTimer = getRespawnDelayForElapsed(elapsedSeconds);
			} else {
				asteroidRespawnTimer -= delta;
				if (asteroidRespawnTimer <= 0) {
					spawnRandomAsteroid(elapsedSeconds);
					asteroidRespawnTimer = getRespawnDelayForElapsed(elapsedSeconds);
				}
			}

			for (let index = cleanupQueue.length - 1; index >= 0; index -= 1) {
				const entry = cleanupQueue[index];
				if (!entry) {
					continue;
				}
				entry.ttl -= delta;
				if (entry.ttl > 0) {
					continue;
				}

				deactivateAsteroid(entry.runtime);
				returnAsteroidToPool(entry.runtime);
				cleanupQueue.splice(index, 1);
			}
		},
		deactivateAll() {
			pendingSplitSpawns.length = 0;
			cleanupQueue.length = 0;
			for (const runtime of asteroidRuntimeById.values()) {
				deactivateAsteroid(runtime);
				returnAsteroidToPool(runtime);
			}
		},
	};
}
