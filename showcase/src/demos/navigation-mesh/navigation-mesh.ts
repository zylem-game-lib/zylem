import { Vector3 } from 'three';
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createText } from '@zylem/game-lib/entity';
import { Platformer3DBehavior, Platformer3DState } from '@zylem/game-lib/behavior/action/platform';
import { createHoverArea } from '@zylem/game-lib/placement';
import type { ShowcaseDemo } from '../../demo-types';
import { playgroundActor } from '../_shared/playground';
import { AGENT_SPAWN, LEVEL_BOUNDS, level } from './level';
import { PathFollower, type RoutePoint } from './path-follower';

const WALK_SPEED = 6;
const RUN_SPEED = 12;
/** The agent runs while more than this much route is left, and walks the rest. */
const RUN_DISTANCE = 10;
/** Radians per second the agent turns toward its heading. */
const TURN_RATE = 12;

const READY_TEXT = 'Click a surface to walk there';

/** The signed shortest turn from `from` to `to`, in radians. */
function turnBetween(from: number, to: number): number {
	const turn = (to - from) % (Math.PI * 2);
	if (turn > Math.PI) return turn - Math.PI * 2;
	if (turn < -Math.PI) return turn + Math.PI * 2;
	return turn;
}

export default function createDemo(): ShowcaseDemo {
	// ─── Agent ───────────────────────────────────────────────────────────────

	const agent = playgroundActor('player', undefined, { ...AGENT_SPAWN });
	const platformer = agent.use(Platformer3DBehavior, {
		walkSpeed: WALK_SPEED,
		runSpeed: RUN_SPEED,
	});
	const follower = new PathFollower();

	/** Whether the navmesh has baked. */
	let ready = false;
	let overlayVisible = true;
	/** Where the last accepted click sent the agent. Kept after arrival, to redraw the route. */
	let destination: RoutePoint | null = null;
	let yaw = 0;

	// ─── Stage ───────────────────────────────────────────────────────────────

	// Fixed, so a left click is always a move order and never a camera drag.
	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 22, z: 22 },
		target: { x: 0, y: 0, z: -1 },
	});

	const status = createText({
		name: 'navigationStatus',
		text: 'Baking navmesh...',
		fontSize: 16,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.06 },
	});

	const stage = createStage(
		{ gravity: new Vector3(0, -9.82, 0), backgroundColor: '#1c2430' },
		camera,
	);
	stage.playLevel(level);

	/** Route the agent to `point`, if the navmesh reaches it at all. */
	function moveTo(point: RoutePoint): void {
		const navigation = stage.navigation;
		const from = agent.getPose()?.position;
		if (!ready || !navigation || !from) return;

		const route = navigation.findPath(from, point);
		if (route.status === 'unreachable') {
			status.updateText('No walkable surface there');
			return;
		}
		destination = point;
		follower.setRoute(route.points);
		// `query` draws the route but also turns the overlay on, so a hidden
		// overlay keeps its old line until it is shown again.
		if (overlayVisible) navigation.query(from, point);
		status.updateText(
			route.status === 'partial' ? 'No way up there: walking as close as the route gets' : READY_TEXT,
		);
	}

	// The pointer ray is tested against this box; the click lands on the
	// level's collision under it.
	const clickArea = createHoverArea({
		name: 'navigationClickArea',
		position: LEVEL_BOUNDS.center,
		size: LEVEL_BOUNDS.size,
		onClick: ({ position }) => moveTo(position),
	});

	stage.add(agent, clickArea, status);

	stage.onSetup(() => {
		void bakeNavigation();
	});

	/** Bake the navmesh from the level's solids, in a worker. */
	async function bakeNavigation(): Promise<void> {
		const navigation = stage.navigation;
		if (!navigation) return;
		const baked = await navigation.bake();
		// The exhibit was replaced while the worker ran.
		if (stage.navigation !== navigation) return;
		ready = baked !== null;
		navigation.setPreview(ready && overlayVisible);
		status.updateText(ready ? READY_TEXT : 'The navmesh failed to bake');
	}

	// ─── Following the route ─────────────────────────────────────────────────

	agent.onUpdate(({ me, delta }: any) => {
		const input = me.$platformer;
		const position = me.getPose()?.position;
		if (!input || !position) return;

		const steering = follower.steer(position);
		input.moveX = steering?.x ?? 0;
		input.moveZ = steering?.z ?? 0;
		input.run = (steering?.remaining ?? 0) > RUN_DISTANCE;
		input.jump = false;

		// The platformer's capsule stays upright and unturned; facing is visual.
		if (steering) {
			const turn = turnBetween(yaw, Math.atan2(steering.x, steering.z));
			const step = TURN_RATE * delta;
			yaw += Math.max(-step, Math.min(step, turn));
		}
		me.setRotationY(yaw);

		switch (platformer.getState()) {
			case Platformer3DState.Running:
				me.playAnimation({ key: 'running' });
				break;
			case Platformer3DState.Walking:
				me.playAnimation({ key: 'walking' });
				break;
			case Platformer3DState.Jumping:
			case Platformer3DState.Falling:
				me.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
				break;
			case Platformer3DState.Landing:
				me.playAnimation({ key: 'jumping-down', pauseAtEnd: true });
				break;
			default:
				me.playAnimation({ key: 'idle' });
				break;
		}
	});

	// ─── Game ────────────────────────────────────────────────────────────────

	// No `debug: true`: debug mode hands the pointer to the editor tools, and
	// the click area would never hear a click.
	const game = createGame({ id: 'navigation-mesh' }, stage);

	game.onUpdate(({ inputs }: any) => {
		if (!inputs.p1.buttons.A.pressed) return;
		const navigation = stage.navigation;
		if (!ready || !navigation) return;

		overlayVisible = !overlayVisible;
		navigation.setPreview(overlayVisible);
		// Routes taken while the overlay was hidden were never drawn.
		const from = agent.getPose()?.position;
		if (overlayVisible && destination && from) navigation.query(from, destination);
	});

	return {
		game,
		description:
			'A level written as a LevelDocument is played on the stage and baked into a Recast navmesh. Click a surface and the Platformer3D actor walks the route there, up the ramp and the steps. The island has no way up, so a route to it stops short.',
		controls: ['Click: walk to that point', 'Z: show or hide the navmesh and route'],
	};
}
