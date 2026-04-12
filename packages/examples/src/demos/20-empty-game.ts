import { createGame, type GameLoadingEvent } from '@zylem/game-lib';
import {
	createBundledZylemRuntimeSession,
	readRenderSlot,
	readSummary,
	writeInputSlotFromParts,
} from '../runtime/zylem-runtime';

async function runRuntimeDemo(): Promise<void> {
	const buffers = await createBundledZylemRuntimeSession(8, 1);

	writeInputSlotFromParts(buffers.inputView, buffers.inputStride, 0, {
		position: [1, 2, 3],
		rotation: [0, 0, 0, 1],
		contacts: 0,
		speed: 1,
	});

	buffers.exports.zylem_runtime_step(0.5);
	buffers.refreshViews();

	const render = readRenderSlot(buffers.renderView, buffers.renderStride, 0);
	const summary = readSummary(buffers.summaryView);

	console.log('zylem-runtime wasm demo (batched buffers)', {
		tick: buffers.exports.zylem_runtime_tick_count(),
		renderSlot0: render,
		summary,
	});
}

export default function createDemo() {
	const game = createGame();

	void runRuntimeDemo().catch((error) => {
		console.error('Failed to load zylem-runtime wasm demo', error);
	});

	game.onLoading((event: GameLoadingEvent) => {
		console.log('my loading event: ', event);
	});

	return game;
}
