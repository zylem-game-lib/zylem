/** Run after tsup: exercises the shipped worker with browser globals and the public API. */
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createLevelNavigation, NavigationMesh } from '../dist/navigation.js';

const worker = new Worker(
	`
  const { parentPort, workerData } = require('node:worker_threads');
  globalThis.self = globalThis;
  globalThis.postMessage = data => parentPort.postMessage(data);
  // Force Emscripten's browser/worker path; the bundle includes its WASM bytes.
  globalThis.process = undefined;
  import(workerData).then(() => parentPort.on('message', data => self.onmessage({data})));
`,
	{ eval: true, workerData: new URL('../dist/navigation-worker.js', import.meta.url).href }
);
let mesh;
try {
	const result = await new Promise((resolve, reject) => {
		const timeout = setTimeout(() => reject(new Error('Worker smoke test timed out')), 15_000);
		worker.once('error', (error) => {
			clearTimeout(timeout);
			reject(error);
		});
		worker.once('message', (data) => {
			clearTimeout(timeout);
			resolve(data);
		});
		worker.postMessage({
			positions: new Float32Array([-10, 0, -10, -10, 0, 10, 10, 0, 10, 10, 0, -10]),
			indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
			navigation: createLevelNavigation(),
		});
	});
	assert.ok(result.bytes?.length, result.error ?? 'Worker returned no navigation data');
	mesh = await NavigationMesh.load(result.bytes);
	assert.equal(mesh.findPath({ x: -5, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }).status, 'complete');
	console.log('Navigation bundle: standalone worker bake and public path query passed.');
} finally {
	mesh?.dispose();
	await worker.terminate();
}
