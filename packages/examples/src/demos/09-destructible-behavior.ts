import { Color, Matrix4, Vector3 } from 'three';
import {
	createBox,
	createCamera,
	createGame,
	createSphere,
	createStage,
	createText,
	Destructible3DBehavior,
	FractureOptions,
	type Destructible3DHandle,
	type FractureOptionsInput,
	useArrowsForDirections,
} from '@zylem/game-lib';

type LaneRuntime = {
	label: string;
	accent: Color;
	target: ReturnType<typeof createBox>;
	projectile: ReturnType<typeof createSphere>;
	handle: Destructible3DHandle;
	position: Vector3;
	spawnPosition: Vector3;
	parkPosition: Vector3;
	launchVelocity: Vector3;
	launchDelay: number;
	impactRadius?: number;
	launched: boolean;
	smashed: boolean;
};

type LaneConfig = {
	label: string;
	position: Vector3;
	spawnPosition: Vector3;
	accent: Color;
	fractureOptions: FractureOptions;
	launchDelay: number;
	launchVelocity: Vector3;
	impactRadius?: number;
};

function slugify(value: string): string {
	return value.toLowerCase().replace(/\s+/g, '-');
}

export default function createDemo() {
	const camera = createCamera({
		position: { x: -16, y: 4.8, z: 4.5 },
		target: { x: 0, y: 2.3, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: new Color('#08131d'),
			gravity: new Vector3(0, -9.82, 0),
		},
		camera,
	);

	stage.setInputConfiguration(useArrowsForDirections('p1'));

	const floor = createBox({
		name: 'floor',
		position: { x: 0, y: -0.35, z: 0 },
		size: { x: 24, y: 0.7, z: 16 },
		collision: { static: true },
		material: {
			color: new Color('#13202c'),
		},
	});

	const backdrop = createBox({
		name: 'backdrop',
		position: { x: 3.3, y: 4.2, z: 0 },
		size: { x: 0.45, y: 8.8, z: 16.5 },
		collision: { static: true },
		material: {
			color: new Color('#102332'),
			opacity: 0.9,
		},
	});

	const instructionText = createText({
		name: 'destructible-instructions',
		text: 'Projectiles auto-launch. Press A to reset the round.',
		fontSize: 17,
		fontColor: '#f8fafc',
		backgroundColor: '#13202c',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.08 },
	});

	const laneConfigs: readonly LaneConfig[] = [
		{
			label: 'Simple Fracture',
			position: new Vector3(0, 2.2, -4.4),
			spawnPosition: new Vector3(-10.6, 2.2, -4.4),
			accent: new Color('#f4b942'),
			fractureOptions: new FractureOptions({
				fractureMethod: 'simple',
				fragmentCount: 7,
				fracturePlanes: {
					x: true,
					y: true,
					z: false,
				},
				seed: 11,
			}),
			launchDelay: 0.2,
			launchVelocity: new Vector3(20, 0, 0),
		},
		{
			label: 'Voronoi 3D',
			position: new Vector3(0, 2.2, 0),
			spawnPosition: new Vector3(-10.6, 2.2, 0),
			accent: new Color('#67e8f9'),
			fractureOptions: new FractureOptions({
				fractureMethod: 'voronoi',
				fragmentCount: 16,
				voronoiOptions: {
					mode: '3D',
				},
				seed: 23,
			}),
			launchDelay: 0.65,
			launchVelocity: new Vector3(20, 0, 0),
		},
		{
			label: 'Impact Voronoi',
			position: new Vector3(0, 2.2, 4.4),
			spawnPosition: new Vector3(-10.6, 2.2, 4.4),
			accent: new Color('#fb7185'),
			fractureOptions: new FractureOptions({
				fractureMethod: 'voronoi',
				fragmentCount: 22,
				voronoiOptions: {
					mode: '3D',
				},
				seed: 7,
			}),
			impactRadius: 0.62,
			launchDelay: 1.1,
			launchVelocity: new Vector3(20, 0, 0),
		},
	] as const;

	const inverseMatrix = new Matrix4();
	const pedestals = laneConfigs.map((lane) =>
		createBox({
			name: `${slugify(lane.label)}-pedestal`,
			position: { x: lane.position.x, y: 0.8, z: lane.position.z },
			size: { x: 2.5, y: 1.6, z: 2.5 },
			collision: { static: true },
			material: {
				color: lane.accent.clone().multiplyScalar(0.3),
			},
		}),
	);
	const launchRails = laneConfigs.map((lane) =>
		createBox({
			name: `${slugify(lane.label)}-rail`,
			position: { x: -5, y: 1.1, z: lane.position.z },
			size: { x: 10.8, y: 0.14, z: 1.2 },
			collision: { static: true },
			material: {
				color: lane.accent.clone().multiplyScalar(0.16),
				opacity: 0.75,
			},
		}),
	);

	const lanes: LaneRuntime[] = laneConfigs.map((lane, index) => {
		const target = createBox({
			name: `${slugify(lane.label)}-crate`,
			position: { x: lane.position.x, y: lane.position.y, z: lane.position.z },
			size: { x: 1.8, y: 1.8, z: 1.8 },
			collision: { static: true },
			material: {
				color: lane.accent.clone(),
			},
		});

		const projectile = createSphere({
			name: `${slugify(lane.label)}-projectile`,
			radius: 0.46,
			position: { x: lane.spawnPosition.x, y: lane.spawnPosition.y, z: lane.spawnPosition.z },
			material: {
				color: lane.accent.clone().offsetHSL(0, 0, 0.08),
			},
		});

		const handle = target.use(Destructible3DBehavior, {
			fractureOptions: lane.fractureOptions,
			fragmentPhysics: {
				mode: 'independent',
				outwardVelocity: 4.5,
				angularVelocity: 2.1,
			},
		});

		const label = createText({
			name: `${slugify(lane.label)}-label`,
			text: lane.label,
			fontSize: 24,
			fontColor: '#f8fafc',
			backgroundColor: '#0b1620',
			padding: 8,
			stickToViewport: false,
			position: {
				x: lane.position.x,
				y: 4.1,
				z: lane.position.z,
			},
		});

		const laneRuntime: LaneRuntime = {
			label: lane.label,
			accent: lane.accent,
			target,
			projectile,
			handle,
			position: lane.position.clone(),
			spawnPosition: lane.spawnPosition.clone(),
			parkPosition: new Vector3(-18, -12 - index * 3, lane.position.z),
			launchVelocity: lane.launchVelocity.clone(),
			launchDelay: lane.launchDelay,
			impactRadius: lane.impactRadius,
			launched: false,
			smashed: false,
		};

		projectile.onSetup(({ me }) => {
			me.body?.setGravityScale(0, true);
			me.body?.lockRotations(true, true);
			me.body?.setTranslation(laneRuntime.parkPosition, true);
			me.body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
			me.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
			if (me.mesh) {
				me.mesh.visible = false;
			}
		});

		projectile.onCollision(({ other }) => {
			if (laneRuntime.smashed || other.uuid !== target.uuid) {
				return;
			}

			laneRuntime.smashed = true;
			retireProjectile(laneRuntime);
			handle.fracture(buildImpactOverride(laneRuntime));
		}, {
			phase: 'enter',
		});

		stage.add(target, projectile, label);

		return laneRuntime;
	});

	stage.add(floor, backdrop, ...pedestals, ...launchRails);

	let initialized = false;
	let roundElapsed = 0;

	function retireProjectile(lane: LaneRuntime) {
		lane.projectile.body?.setTranslation(lane.parkPosition, true);
		lane.projectile.body?.setLinvel({ x: 0, y: 0, z: 0 }, true);
		lane.projectile.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
		if (lane.projectile.mesh) {
			lane.projectile.mesh.visible = false;
		}
	}

	function launchProjectile(lane: LaneRuntime) {
		lane.projectile.body?.setTranslation(lane.spawnPosition, true);
		lane.projectile.body?.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
		lane.projectile.body?.setLinvel(lane.launchVelocity, true);
		lane.projectile.body?.setAngvel({ x: 0, y: 0, z: 0 }, true);
		if (lane.projectile.mesh) {
			lane.projectile.mesh.visible = true;
		}
	}

	function getProjectileWorldPosition(lane: LaneRuntime): Vector3 | null {
		const translation = lane.projectile.body?.translation();
		if (translation) {
			return new Vector3(
				translation.x,
				translation.y,
				translation.z,
			);
		}

		const target = lane.projectile.group ?? lane.projectile.mesh;
		if (!target) {
			return null;
		}

		return target.getWorldPosition(new Vector3());
	}

	function buildImpactOverride(lane: LaneRuntime): FractureOptionsInput | undefined {
		if (lane.impactRadius == null) {
			return undefined;
		}

		const impactWorld = getProjectileWorldPosition(lane);
		const targetRoot = lane.target.group ?? lane.target.mesh;
		if (!impactWorld || !targetRoot) {
			return undefined;
		}

		targetRoot.updateMatrixWorld(true);
		const impactPoint = impactWorld.clone().applyMatrix4(
			inverseMatrix.copy(targetRoot.matrixWorld).invert(),
		);

		return {
			fractureMethod: 'voronoi',
			voronoiOptions: {
				impactPoint,
				impactRadius: lane.impactRadius,
			},
		};
	}

	function resetRound() {
		roundElapsed = 0;

		for (const lane of lanes) {
			lane.handle.repair();
			lane.launched = false;
			lane.smashed = false;
			retireProjectile(lane);
		}
	}

	const game = createGame(
		{
			id: 'destructible-behavior-demo',
			debug: true,
		},
		stage,
		instructionText,
	).onUpdate(({ inputs, delta }) => {
		if (!initialized) {
			resetRound();
			initialized = true;
		}

		const { p1 } = inputs;
		if (p1.buttons.A?.pressed) {
			resetRound();
		}

		roundElapsed += delta;

		for (const lane of lanes) {
			if (lane.launched || roundElapsed < lane.launchDelay) {
				continue;
			}

			launchProjectile(lane);
			lane.launched = true;
		}
	});

	return game;
}
