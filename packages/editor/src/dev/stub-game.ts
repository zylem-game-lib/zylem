/**
 * Standalone stub harness for `pnpm dev:editor`.
 *
 * Mounts an empty `<zylem-game>` shell (no WebGL Game instance) and publishes
 * dummy payloads through the shared `@zylem/bridge` channel so editor panels
 * have data, then wires `attachEditorStateBridge` so toolbar actions are
 * observable in the console.
 */

import '@zylem/game-lib/web-components';
import { getZylemBridge, type EntitySummaryPayload } from '@zylem/bridge';
import { attachEditorStateBridge } from '../host/editor-host';

/**
 * Build a tiny SVG data-URL thumbnail for stub entity previews.
 */
function stubThumbnail(label: string, fill: string): string {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
		<rect width="96" height="96" fill="#1a1a1e"/>
		<rect x="16" y="16" width="64" height="64" rx="8" fill="${fill}"/>
		<text x="48" y="54" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#fff">${label}</text>
	</svg>`;
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const STUB_ENTITIES: EntitySummaryPayload[] = [
	{
		uuid: 'stub-box-001',
		name: 'Player',
		type: 'Box',
		position: { x: 0, y: 1, z: 0 },
		rotation: { x: 0, y: 0, z: 0 },
		scale: { x: 1, y: 1, z: 1 },
		thumbnail: stubThumbnail('Box', '#4a9eff'),
		bounds: { width: 1, height: 1, depth: 1 },
	},
	{
		uuid: 'stub-sphere-002',
		name: 'Ball',
		type: 'Sphere',
		position: { x: 2, y: 0.5, z: -1 },
		rotation: { x: 0, y: 0.3, z: 0 },
		scale: { x: 1, y: 1, z: 1 },
		thumbnail: stubThumbnail('Sphere', '#ff6b4a'),
		bounds: { width: 1, height: 1, depth: 1 },
	},
	{
		uuid: 'stub-plane-003',
		name: 'Ground',
		type: 'Plane',
		position: { x: 0, y: 0, z: 0 },
		rotation: { x: -Math.PI / 2, y: 0, z: 0 },
		scale: { x: 10, y: 1, z: 10 },
		thumbnail: stubThumbnail('Plane', '#3d8b5a'),
		bounds: { width: 10, height: 0.1, depth: 10 },
	},
	{
		uuid: 'stub-gltf-004',
		name: 'Prop',
		type: 'GLTF',
		position: { x: -2, y: 0, z: 1.5 },
		rotation: { x: 0, y: Math.PI / 4, z: 0 },
		scale: { x: 1, y: 1, z: 1 },
		thumbnail: stubThumbnail('GLTF', '#b07cff'),
		bounds: { width: 1.2, height: 1.8, depth: 0.8 },
	},
];

/**
 * Publish the full stub game state through the bridge channel.
 */
function publishStubState(): void {
	const { channel } = getZylemBridge();

	channel.send('game:config', {
		id: 'stub-game',
		aspectRatio: 16 / 9,
		fullscreen: false,
		bodyBackground: '#0d0d10',
		internalResolution: { width: 1280, height: 720 },
		debug: true,
	});

	channel.send('stage:snapshot', {
		stage: {
			id: 'stub-stage',
			backgroundColor: '#1a1a22',
			backgroundImage: null,
			gravity: { x: 0, y: -9.81, z: 0 },
			inputs: {
				p1: ['keyboard-1', 'gamepad-1'],
				p2: ['keyboard-2', 'gamepad-2'],
			},
			variables: {
				lives: 3,
				level: 1,
				paused: false,
			},
		},
		entities: STUB_ENTITIES,
	});

	channel.send('game:variable', {
		path: 'score',
		value: 42,
		previousValue: 0,
	});
}

/**
 * Create and style the empty `<zylem-game>` shell used as the stub background.
 */
export function createStubGameElement(): HTMLElement {
	const game = document.createElement('zylem-game');
	game.style.display = 'block';
	game.style.position = 'absolute';
	game.style.inset = '0';
	game.style.width = '100%';
	game.style.height = '100%';
	game.style.background =
		'radial-gradient(ellipse at center, #1e1e28 0%, #0d0d10 70%)';
	return game;
}

/**
 * Wire the editor↔game bridge and publish the dummy game state.
 * Call after `<zylem-editor>` is in the DOM so subscribers are ready.
 */
export function bootstrapStubGame(): void {
	attachEditorStateBridge({
		onStateDispatch(payload) {
			console.debug('[editor stub] editor command', payload);
		},
	});

	publishStubState();
}
