/**
 * Dev harness for `pnpm --filter @zylem/editor dev`.
 *
 * Boots a real game — WebGL, wasm physics, and the game-side bridge adapter —
 * rather than publishing canned payloads. The transform tools are only
 * meaningful against a live scene: the gizmo is game-side geometry, snapping
 * happens against real poses, and undo replays through the physics world. A stub
 * would exercise none of it.
 */

import '@zylem/game-lib/web-components';
import { createCamera, createGame, createStage } from '@zylem/game-lib/core';
import { createBox, createPlane, createSphere } from '@zylem/game-lib/entity';
import { Color } from 'three';

import { attachEditorStateBridge } from '../host/editor-host';

/** A floor plus a handful of primitives at snap-aligned positions. */
function createHarnessStage() {
	const ground = createPlane({
		tile: { x: 24, y: 24 },
		position: { x: 0, y: 0, z: 0 },
		material: { color: new Color('#2f3b4a') },
		collision: { static: true },
	});

	const platform = createBox({
		name: 'Platform',
		size: { x: 4, y: 0.5, z: 4 },
		position: { x: -3, y: 0.25, z: 0 },
		color: new Color('#3d8b5a'),
		collision: { static: true },
	});

	const crate = createBox({
		name: 'Crate',
		size: { x: 1, y: 1, z: 1 },
		position: { x: 0, y: 0.5, z: 0 },
		color: new Color('#4a9eff'),
		collision: { static: true },
	});

	const tallCrate = createBox({
		name: 'Tall Crate',
		size: { x: 1, y: 2, z: 1 },
		position: { x: 2, y: 1, z: -1.5 },
		color: new Color('#b07cff'),
		collision: { static: true },
	});

	const ball = createSphere({
		name: 'Ball',
		radius: 0.5,
		position: { x: 1.5, y: 0.5, z: 2 },
		color: new Color('#ff6b4a'),
		collision: { static: true },
	});

	const camera = createCamera({
		perspective: 'third-person',
		position: { x: 8, y: 8, z: 12 },
		target: { x: 0, y: 0, z: 0 },
		useOrbitalControls: true,
	});

	return createStage(
		{
			backgroundColor: '#12161d',
			// Entities are authored static so they stay where they are placed
			// instead of settling under gravity between edits.
			gravity: { x: 0, y: -9.81, z: 0 },
		},
		camera,
		ground,
		platform,
		crate,
		tallCrate,
		ball,
	);
}

/**
 * Create the `<zylem-game>` element for the harness.
 *
 * The element's `game` setter starts the game, so it is assigned after the
 * element is in the DOM and has a size — the renderer reads its bounds on start.
 */
export function createHarnessGameElement(): HTMLElement {
	const element = document.createElement('zylem-game');
	element.style.display = 'block';
	element.style.position = 'absolute';
	element.style.inset = '0';
	element.style.width = '100%';
	element.style.height = '100%';
	return element;
}

/**
 * Start the harness game inside `element` and wire the host state bridge.
 *
 * @returns The running game.
 */
export function bootstrapHarnessGame(element: HTMLElement) {
	attachEditorStateBridge({
		onStateDispatch(payload) {
			console.debug('[editor harness] editor command', payload);
		},
	});

	const game = createGame(
		{
			id: 'editor-harness',
			// Debug on from the start, so selection, hover, and the gizmo are live
			// without a trip to the toolbar.
			debug: true,
		},
		createHarnessStage(),
	);

	(element as HTMLElement & { game: unknown }).game = game;
	(element as HTMLElement & { focus(): void }).focus();

	return game;
}
