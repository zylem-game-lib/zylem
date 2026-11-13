/** Run after tsup. Requires a WebGPU adapter (hardware or a software Vulkan ICD). */
import assert from 'node:assert/strict';
import { create, globals } from 'webgpu';
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { createAmbientOcclusion } from '../dist/graphics.js';

Object.assign(globalThis, globals);
globalThis.self = { requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} };
const gpu = create(process.env.AO_GPU_BACKEND ? [`backend=${process.env.AO_GPU_BACKEND}`] : []);
Object.defineProperty(globalThis, 'navigator', { value: { gpu } });
const adapter = await gpu.requestAdapter();
assert.ok(adapter, 'No WebGPU adapter; configure a hardware driver or software Vulkan ICD.');
const device = await adapter.requestDevice();
const errors = [];
device.addEventListener('uncapturederror', (event) => errors.push(event.error.message));
const canvas = {
	width: 192,
	height: 144,
	style: {},
	addEventListener() {},
	removeEventListener() {},
	setAttribute() {},
};
let surface;
const context = {
	configure() {},
	getCurrentTexture() {
		surface ??= device.createTexture({
			size: [canvas.width, canvas.height],
			format: 'bgra8unorm',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
		});
		return surface;
	},
};
const renderer = new THREE.WebGPURenderer({ device, canvas, context, antialias: false });
renderer.setSize(192, 144, false);
await renderer.init();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8899aa);
scene.add(new THREE.AmbientLight(0xffffff, 2));
const material = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1 });
const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 10), material);
ground.position.y = -0.05;
const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), material);
cube.position.y = 1;
const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.2), material);
wall.position.set(0, 1.5, -2.5);
const emissive = new THREE.Mesh(
	new THREE.SphereGeometry(0.4, 16, 12),
	new THREE.MeshStandardMaterial({ color: 0, emissive: 0xff3300, emissiveIntensity: 1 })
);
emissive.position.set(-2, 0.4, 0);
scene.add(ground, cube, wall, emissive);
const target = new THREE.RenderTarget(192, 144, { type: THREE.UnsignedByteType });
let baselineTextures;

async function draw(pipeline) {
	renderer.setRenderTarget(target);
	// Node's headless harness has no animation loop; advance FRAME update nodes explicitly.
	renderer._nodes.nodeFrame.update();
	pipeline.render();
	await device.queue.onSubmittedWorkDone();
	return renderer.readRenderTargetPixelsAsync(target, 0, 0, target.width, target.height);
}

function compare(base, pixels, label) {
	let darker = 0;
	let emission = 0;
	let background = 0;
	for (let i = 0; i < base.length; i += 4) {
		if (base[i] > 200 && base[i + 2] === 0) {
			assert.deepEqual(pixels.slice(i, i + 4), base.slice(i, i + 4), `${label}: emission changed`);
			emission++;
		} else if (base[i] < base[i + 1] && base[i + 1] < base[i + 2]) {
			assert.deepEqual(
				pixels.slice(i, i + 4),
				base.slice(i, i + 4),
				`${label}: background changed`
			);
			background++;
		} else if (pixels[i] < base[i] - 2) darker++;
	}
	assert.ok(darker > 30, `${label}: missing contact occlusion (${darker} pixels)`);
	assert.ok(emission > 10 && background > 100, `${label}: fixture coverage`);
}

try {
	for (const projection of ['perspective', 'orthographic']) {
		const camera =
			projection === 'perspective'
				? new THREE.PerspectiveCamera(55, 192 / 144, 0.1, 50)
				: new THREE.OrthographicCamera(-5, 5, 3.75, -3.75, 0.1, 50);
		camera.position.set(6, 5, 7);
		camera.lookAt(0, 0.5, 0);
		camera.updateMatrixWorld();
		let base;
		for (const options of [
			false,
			...['ssao', 'gtao', 'cortao'].flatMap((method) =>
				['low', 'medium', 'high'].map((quality) => ({
					method,
					quality,
					radius: 1.5,
					denoise: quality !== 'low',
				}))
			),
		]) {
			const ao = createAmbientOcclusion(scene, camera, options);
			const main = pass(scene, camera);
			if (ao) main.contextNode = ao.contextNode;
			const pipeline = new THREE.RenderPipeline(renderer, main.getTextureNode());
			try {
				const pixels = await draw(pipeline);
				if (!options) base = pixels;
				else compare(base, pixels, `${projection}/${options.method}/${options.quality}`);
				if (options && options.quality === 'high') {
					// Reuse the graph through resize and a camera move, exercising live matrix uniforms.
					renderer.setSize(160, 120, false);
					target.setSize(160, 120);
					camera.position.x += 0.5;
					camera.lookAt(0, 0.5, 0);
					camera.updateProjectionMatrix();
					const moved = await draw(pipeline);
					assert.ok(
						moved.some((v, i) => i % 4 !== 3 && v > 0),
						'Resize produced an empty frame'
					);
					camera.position.x -= 0.5;
					camera.lookAt(0, 0.5, 0);
					renderer.setSize(192, 144, false);
					target.setSize(192, 144);
				}
			} finally {
				pipeline.dispose();
				ao?.dispose();
				ao?.dispose(); // safe repeated teardown
				main.dispose();
			}
			baselineTextures ??= renderer.info.memory.textures;
			assert.ok(
				renderer.info.memory.textures <= baselineTextures,
				`AO texture leak: ${renderer.info.memory.textures} > ${baselineTextures}`
			);
		}
	}
	assert.deepEqual(errors, [], 'GPU validation errors');
	console.log(
		'AO GPU: 3 methods × 3 qualities × 2 cameras; contact shadows, emission, background, resize and disposal passed.'
	);
} finally {
	target.dispose();
	scene.traverse((object) => object.geometry?.dispose());
	material.dispose();
	emissive.material.dispose();
	renderer.dispose();
	surface?.destroy();
	device.destroy();
}
