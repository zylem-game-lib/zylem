/** Run after the package build. Requires a WebGPU adapter or software Vulkan ICD. */
import assert from 'node:assert/strict';
import { create, globals } from 'webgpu';
import * as THREE from 'three/webgpu';
import { pass, vec4 } from 'three/tsl';
import { createPlanet, createStageBackground } from '../dist/graphics.js';

Object.assign(globalThis, globals);
globalThis.self = { requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} };
const gpu = create(
	process.env.SPACE_GPU_BACKEND ? [`backend=${process.env.SPACE_GPU_BACKEND}`] : []
);
Object.defineProperty(globalThis, 'navigator', { value: { gpu } });
const adapter = await gpu.requestAdapter();
assert.ok(adapter, 'No WebGPU adapter; configure a hardware driver or software Vulkan ICD.');
const device = await adapter.requestDevice();
const errors = [];
device.addEventListener('uncapturederror', (event) => errors.push(event.error.message));
const canvas = {
	width: 320,
	height: 240,
	style: {},
	addEventListener() {},
	removeEventListener() {},
	setAttribute() {},
};
let surface;
const context = {
	configure() {},
	getCurrentTexture() {
		return (surface ??= device.createTexture({
			size: [canvas.width, canvas.height],
			format: 'bgra8unorm',
			usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
		}));
	},
};
const renderer = new THREE.WebGPURenderer({ device, canvas, context, antialias: true });
renderer.setSize(320, 240, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
await renderer.init();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(44, 320 / 240, 0.1, 2000);
camera.position.set(0, 25, -115);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
const target = new THREE.RenderTarget(320, 240, { type: THREE.UnsignedByteType });
const main = pass(scene, camera);
const pipeline = new THREE.RenderPipeline(renderer, main.getTextureNode());
let background;
let planet;

async function draw() {
	renderer.setRenderTarget(target);
	// The headless harness has no RAF loop to advance FRAME update nodes.
	renderer._nodes.nodeFrame.update();
	pipeline.render();
	await device.queue.onSubmittedWorkDone();
	return renderer.readRenderTargetPixelsAsync(target, 0, 0, target.width, target.height);
}
function difference(a, b) {
	let changed = 0;
	for (let i = 0; i < a.length; i += 4)
		if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 8)
			changed++;
	return changed;
}
function energy(pixels) {
	return pixels.reduce((sum, value, index) => sum + (index % 4 === 3 ? 0 : value), 0);
}

try {
	background = await createStageBackground(scene, renderer, camera, {
		type: 'color',
		color: '#214477',
	});
	const solid = await draw();
	assert.ok(solid[2] > solid[1] && solid[1] > solid[0], 'Solid background is not blue');
	background.dispose();
	background = await createStageBackground(scene, renderer, camera, {
		type: 'gradient',
		top: '#214477',
		horizon: '#8899aa',
		bottom: '#090c22',
	});
	const gradient = await draw();
	assert.ok(difference(solid, gradient) > 1000, 'Gradient did not replace solid background');
	assert.ok(
		Math.abs(gradient[1] - gradient[gradient.length - 3]) > 10,
		'Gradient has no vertical color change'
	);
	background.dispose();

	background = await createStageBackground(scene, renderer, camera, {
		type: 'space',
		stars: { count: 4500, brightness: 1.5 },
		sun: {},
	});
	const stars = await draw();
	assert.ok(
		stars.filter((value, index) => index % 4 !== 3 && value > 80).length > 30,
		'Missing bright stars'
	);
	camera.position.x += 1000; // Translation without rotation must not create star parallax.
	camera.updateMatrixWorld();
	const translated = await draw();
	assert.ok(difference(stars, translated) < 20, 'Distant stars shifted when the camera translated');
	camera.position.x -= 1000;
	camera.updateMatrixWorld();

	planet = createPlanet({ moons: 'crossed' }).create();
	scene.add(planet.group);
	const first = await draw();
	assert.ok(difference(stars, first) > 2000, 'Planet failed to render');
	let blue = 0;
	for (let i = 0; i < first.length; i += 4)
		if (first[i + 2] > 60 && first[i + 2] > first[i] * 1.4 && first[i + 1] > 30) blue++;
	assert.ok(blue > 1000, 'Oceans lost their blue color');
	for (const name of [
		'Planet.Rings',
		'Planet.Atmosphere',
		'Planet.Clouds',
		'Planet.Moon.1',
		'Planet.Moon.2',
	]) {
		const object = planet.group.getObjectByName(name);
		assert.ok(object, `${name} missing`);
		object.visible = false;
		const hidden = await draw();
		object.visible = true;
		assert.ok(difference(first, hidden) > 3, `${name} contributes no visible pixels`);
	}
	planet.setTime(12);
	const animated = await draw();
	assert.ok(difference(first, animated) > 500, 'Planet animation did not change the frame');
	renderer.setSize(240, 180, false);
	target.setSize(240, 180);
	camera.position.x = 30;
	camera.lookAt(0, 0, 0);
	assert.ok(energy(await draw()) > 10000, 'Resize/camera move produced an empty frame');
	planet.nodeCleanup({ me: planet, globals: {} });
	planet = undefined;
	background.dispose();
	background = undefined;
	assert.equal(scene.children.length, 0, 'Background or planet objects leaked');

	background = await createStageBackground(scene, renderer, camera, {
		type: 'sky',
		quality: 'low',
		timeOfDay: 14,
		cycleDuration: 24,
		stars: { count: 200 },
	});
	const day = await draw();
	assert.ok(energy(day) > 100000, 'Sky first frame is black');
	background.update(camera, 12);
	const night = await draw();
	assert.ok(energy(day) > energy(night) * 3, 'Day/night cycle did not darken the sky');
	const replacement = vec4(0.1, 0.2, 0.3, 1);
	scene.backgroundNode = replacement;
	background.dispose();
	background.dispose();
	background = undefined;
	assert.equal(scene.children.length, 0, 'Sky sun/stars leaked');
	assert.equal(scene.background, null);
	assert.equal(scene.environment, null);
	assert.equal(
		scene.backgroundNode,
		replacement,
		'Sky teardown overwrote another background owner'
	);
	scene.backgroundNode = null;
	assert.deepEqual(errors, [], 'GPU validation errors');
	console.log(
		'Space GPU: solid/gradient/stars, camera translation, planet layers and two moons, animation, resize, sky day/night and teardown passed.'
	);
} finally {
	planet?.nodeCleanup({ me: planet, globals: {} });
	background?.dispose();
	pipeline.dispose();
	main.dispose();
	target.dispose();
	renderer.dispose();
	surface?.destroy();
	device.destroy();
}
