/**
 * Behavior toggling
 *
 * One ship carries four behaviors and runs two of them at a time:
 * - Z swaps its movement between ThrusterBehavior and TopDownMovementBehavior
 * - a repeating action swaps its edge handling between ScreenWrapBehavior and
 *   WorldBoundary2DBehavior every few seconds
 *
 * Every behavior is attached once with `use()`. After that the ship only calls
 * `disable()` and `enable()` on the handles it kept, which starts and stops the
 * behavior in the simulation without building anything new.
 */

import { Color } from 'three';
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createCone, createText } from '@zylem/game-lib/entity';
import { callFunc, delay, repeatForever, sequence } from '@zylem/game-lib/actions';
import {
	ScreenWrapBehavior,
	ThrusterBehavior,
	TopDownMovementBehavior,
	WorldBoundary2DBehavior,
	type ThrusterEntity,
	type TopDownMovementEntity,
} from '@zylem/game-lib/behavior';
import { useArrowsForAxes } from '@zylem/game-lib/input';

import type { ShowcaseDemo } from '../../demo-types';

/** Play area on the X/Y plane, centred on the origin. */
const AREA = { width: 24, height: 14 };
const HALF_WIDTH = AREA.width / 2;
const HALF_HEIGHT = AREA.height / 2;
/** How long each edge behavior stays on. */
const EDGE_SWAP_MS = 4000;

/** A thin bar marking one side of the play area. It does not collide. */
function edgeBar(name: string, width: number, height: number, x: number, y: number) {
	return createBox({
		name,
		size: { x: width, y: height, z: 0.2 },
		position: { x, y, z: 0 },
		collision: { static: true, sensor: true },
		color: new Color(0x415a77),
	});
}

export default function createDemo(): ShowcaseDemo {
	const stage = createStage(
		{
			gravity: { x: 0, y: 0, z: 0 },
			inputs: { p1: ['gamepad-1', 'keyboard-1'] },
			backgroundColor: new Color(0x0b0f14),
		},
		createCamera({ perspective: Perspectives.Fixed2D, zoom: AREA.height + 6 }),
	);
	stage.setInputConfiguration(useArrowsForAxes('p1'));

	const ship = createCone({
		name: 'ship',
		radius: 0.5,
		height: 1.6,
		position: { x: 0, y: 0, z: 0 },
		// Fly on the X/Y plane and turn only around Z.
		collision: { lockRotations: [true, true, false], lockTranslations: [false, false, true] },
		color: new Color(0x60a5fa),
	});

	// Attach all four once. Two start switched off.
	const thruster = ship.use(ThrusterBehavior, {
		linearThrust: 10,
		angularThrust: 4,
		linearDamping: 0.4,
	});
	const topDown = ship.use(TopDownMovementBehavior, { moveSpeed: 8 });
	const wrap = ship.use(ScreenWrapBehavior, { width: AREA.width, height: AREA.height });
	const boundary = ship.use(WorldBoundary2DBehavior, {
		boundaries: { left: -HALF_WIDTH, right: HALF_WIDTH, bottom: -HALF_HEIGHT, top: HALF_HEIGHT },
	});
	topDown.disable();
	boundary.disable();

	const behaviors = [
		{ label: 'Thruster', handle: thruster },
		{ label: 'Top-down movement', handle: topDown },
		{ label: 'Screen wrap', handle: wrap },
		{ label: 'World boundary', handle: boundary },
	];
	const enabledBehaviors = () =>
		`Enabled: ${behaviors
			.filter(({ handle }) => handle.enabled)
			.map(({ label }) => label)
			.join(' + ')}`;

	const status = createText({
		name: 'enabled-behaviors',
		text: enabledBehaviors(),
		fontSize: 16,
		stickToViewport: true,
		screenAnchor: 'top-left',
		screenPosition: { x: 16, y: 14 },
	});
	// The text is rebuilt only when something is switched, not every frame.
	const showEnabledBehaviors = () => status.updateText(enabledBehaviors());

	// Timer: swap the edge behavior every few seconds.
	ship.runAction(
		repeatForever(
			sequence(
				delay(EDGE_SWAP_MS),
				callFunc(() => {
					if (wrap.enabled) {
						wrap.disable();
						boundary.enable();
					} else {
						boundary.disable();
						wrap.enable();
					}
					showEnabledBehaviors();
				}),
			),
		),
	);

	// Each behavior adds its input component the first time it runs.
	const controls = ship as Partial<ThrusterEntity & TopDownMovementEntity>;

	ship.onUpdate(({ inputs }) => {
		const { p1 } = inputs;

		// Input: swap the movement behavior.
		if (p1.buttons.A.pressed) {
			if (thruster.enabled) {
				thruster.disable();
				topDown.enable();
			} else {
				topDown.disable();
				thruster.enable();
			}
			showEnabledBehaviors();
		}

		const horizontal = p1.axes.Horizontal.value;
		const vertical = p1.axes.Vertical.value;
		if (thruster.enabled && controls.$thruster) {
			// Up thrusts along the nose; left and right turn.
			controls.$thruster.thrust = Math.max(0, -vertical);
			controls.$thruster.rotate = horizontal;
		} else if (topDown.enabled && controls.$topDownMovement) {
			// The arrows move the ship directly.
			controls.$topDownMovement.moveX = horizontal;
			controls.$topDownMovement.moveY = -vertical;
		}
	});

	const game = createGame(
		{ id: 'behavior-toggling' },
		stage,
		edgeBar('edge-top', AREA.width, 0.12, 0, HALF_HEIGHT),
		edgeBar('edge-bottom', AREA.width, 0.12, 0, -HALF_HEIGHT),
		edgeBar('edge-left', 0.12, AREA.height, -HALF_WIDTH, 0),
		edgeBar('edge-right', 0.12, AREA.height, HALF_WIDTH, 0),
		ship,
		status,
	);

	return {
		game,
		description:
			'One ship with four behaviors attached and two running at a time. Z swaps how it moves; a timer swaps what happens at the edge of the play area. Each swap is a disable() and an enable() on handles created once.',
		controls: [
			'Z: swap thruster and top-down movement',
			'Arrow keys: fly (thruster: up thrusts, left and right turn; top-down: move directly)',
			'Timer: the edge switches between wrapping and a solid boundary every 4 s',
		],
	};
}
