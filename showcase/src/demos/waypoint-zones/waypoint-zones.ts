import { Color, MathUtils } from 'three';
import {
	createCamera, createGame, createStage, Perspectives, type CameraWaypoints, type Vec3Input,
} from '@zylem/game-lib/core';
import {
	Platformer3DBehavior, Platformer3DState, type Platformer3DEntity,
} from '@zylem/game-lib/behavior/action/platform';
import { boxMesh, create, createText, createZone, pillCollision, pillMesh, type ZylemZone } from '@zylem/game-lib/entity';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import type { ShowcaseDemo } from '../../demo-types';
import { cameraBlock } from '../_shared/camera-court';

const ZONE_WIDTH = 7.2;
const ZONE_DEPTH = 7.8;
const FOLLOW_LABEL = 'Third-person follow';

const cameraZones = [
	{
		x: -6.8,
		name: 'Overhead view',
		accent: 0x65ddce,
		pavement: 0x29696d,
		waypoints: [
			{ position: [-10, 10, 10], lookAt: [-6.8, 1.2, 0], duration: 0.55 },
			{ position: [-8.8, 16, 6], lookAt: [-6.8, 1.2, 0], duration: 0.8 },
		],
	},
	{
		x: 6.8,
		name: 'Low-angle view',
		accent: 0xf7b655,
		pavement: 0x825a2f,
		waypoints: [
			{ position: [9, 6.5, 11], lookAt: [6.8, 1.4, 0], duration: 0.55 },
			{ position: [13.4, 5.15, 7.8], lookAt: [6.8, 1.4, 0], duration: 0.8 },
		],
	},
] satisfies { x: number; name: string; accent: number; pavement: number; waypoints: CameraWaypoints }[];

/** A floor marking with no collider, so the player walks across it at the floor height. */
function floorMarking(name: string, x: number, y: number, width: number, depth: number, color: number) {
	return create({ name, position: { x, y, z: 0 } }).add(boxMesh({
		size: [width, 0.01, depth],
		color: new Color(color),
	}));
}

function createCourier(position: Vec3Input) {
	const shell = new Color(0xece5d4);
	const trim = new Color(0x233642);
	const boots = [-0.32, 0.32].map((x) => boxMesh({
		position: [x, 0.23, 0.1],
		size: [0.4, 0.46, 0.62],
		color: trim,
	}));
	const player = create({ name: 'Courier', position, rotation: [0, Math.PI, 0] }).add(
		pillMesh({ position: [0, 1.19, 0], radius: 0.59, length: 0.62, color: shell }),
		boxMesh({ position: [0, 2.0, 0], size: [0.96, 0.68, 0.8], color: shell }),
		boxMesh({ position: [0, 2.04, 0.41], size: [0.78, 0.25, 0.05], color: trim }),
		boxMesh({ position: [0, 2.05, 0.44], size: [0.5, 0.065, 0.02], color: new Color(0xff795f) }),
		boxMesh({ position: [-0.65, 1.26, 0], size: [0.25, 0.64, 0.35], color: trim }),
		boxMesh({ position: [0.65, 1.26, 0], size: [0.25, 0.64, 0.35], color: trim }),
		...boots,
		pillCollision({ offset: [0, 1.17, 0], radius: 0.65, length: 1.04, lockRotations: true }),
	);
	const platformer = player.use(Platformer3DBehavior, { walkSpeed: 5.5 });
	const controlledPlayer: typeof player & Partial<Platformer3DEntity> = player;
	let facing = Math.PI;
	let stride = 0;
	player.onUpdate(({ me, inputs, delta }) => {
		const movement = controlledPlayer.$platformer;
		if (!movement) return;
		movement.moveX = inputs.p1.axes.Horizontal.value;
		movement.moveZ = inputs.p1.axes.Vertical.value;

		if (movement.moveX || movement.moveZ) {
			const yaw = Math.atan2(movement.moveX, movement.moveZ);
			if (facing !== yaw) {
				me.setRotationY(yaw);
				facing = yaw;
			}
		}

		stride = platformer.getState() === Platformer3DState.Walking ? stride + delta * 12 : 0;
		const step = Math.sin(stride) * 0.23;
		for (const [index, boot] of boots.entries()) {
			const offset = index === 0 ? step : -step;
			boot.position.z = MathUtils.damp(boot.position.z, 0.1 + offset, 20, delta);
			boot.position.y = 0.23 + Math.max(0, offset) * 0.38;
		}
	});
	return player;
}

export default function createDemo(): ShowcaseDemo {
	const spawn = { x: 0, y: 0.06, z: 2.75 };
	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		perspectiveOptions: { distance: 13, height: 7.5, fov: 59 },
		position: [spawn.x, spawn.y + 7.5, spawn.z + 13],
		target: spawn,
		skipDebugOrbit: true,
	});
	const stage = createStage({
		backgroundColor: new Color(0x17252e),
		gravity: { x: 0, y: -9.82, z: 0 },
	}, camera).setInputConfiguration(useArrowsForAxes('p1'));

	const player = createCourier(spawn);
	player.onSetup(({ me }) => camera.addTarget(me));

	const cameraLabel = createText({
		name: 'Camera view',
		text: FOLLOW_LABEL,
		fontSize: 16,
		stickToViewport: true,
		screenAnchor: 'top-left',
		screenPosition: { x: 18, y: 16 },
	});
	stage.add(
		player,
		cameraLabel,
		cameraBlock('Courtyard', [0, -0.3, 0], [28, 0.6, 17], 0x435661),
		cameraBlock('North wall', [0, 0.6, -8.3], [28, 1.2, 0.4], 0x2c414c),
		cameraBlock('South wall', [0, 0.6, 8.3], [28, 1.2, 0.4], 0x2c414c),
		cameraBlock('West wall', [-13.8, 0.6, 0], [0.4, 1.2, 17], 0x2c414c),
		cameraBlock('East wall', [13.8, 0.6, 0], [0.4, 1.2, 17], 0x2c414c),
		floorMarking('Central path', 0, 0.01, 3.5, 16, 0x617682),
	);

	let activeZone: ZylemZone | undefined;
	for (const { x, name, accent, pavement, waypoints } of cameraZones) {
		const zone = createZone({
			name,
			position: [x, 2, 0],
			size: [ZONE_WIDTH, 4, ZONE_DEPTH],
		})
			.onEnter(({ self, visitor }) => {
				if (visitor.uuid !== player.uuid) return;
				activeZone = self;
				camera.clearWaypoints();
				camera.addWaypoints(...waypoints);
				cameraLabel.updateText(name);
			})
			.onExit(({ self, visitor }) => {
				if (visitor.uuid !== player.uuid || activeZone !== self) return;
				activeZone = undefined;
				camera.clearWaypoints();
				cameraLabel.updateText(FOLLOW_LABEL);
			});

		stage.add(
			zone,
			floorMarking(`${name} border`, x, 0.01, ZONE_WIDTH, ZONE_DEPTH, accent),
			floorMarking(`${name} floor`, x, 0.02, ZONE_WIDTH - 0.24, ZONE_DEPTH - 0.24, pavement),
		);
		for (const pillarX of [x - 2.9, x + 2.9]) {
			stage.add(
				cameraBlock(`${name} pillar`, [pillarX, 1.1, -4.9], [0.65, 2.2, 0.65], pavement),
				cameraBlock(`${name} pillar cap`, [pillarX, 2.3, -4.9], [0.85, 0.2, 0.85], accent),
			);
		}
	}

	return {
		game: createGame({ id: 'waypoint-zones', debug: false }, stage),
		description: 'Walk onto the teal pad for an overhead view or the amber pad for a low-angle view. Each Zone plays its own waypoint route. Step off either pad to resume third-person follow.',
		controls: ['Arrows: move the character'],
	};
}
