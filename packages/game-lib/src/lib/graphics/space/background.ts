import { AmbientLight, Color, DirectionalLight, Vector3, type Camera, type Scene } from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import { mix, positionWorldDirection, smoothstep, uniform, vec4 } from 'three/tsl';
import { SPACE_SUN_DIRECTION, validateBackground, type StageBackground } from './background-config';

/** Create stage-owned background resources after renderer initialization. */
export async function createStageBackground(
	scene: Scene,
	renderer: WebGPURenderer,
	camera: Camera,
	config: StageBackground
) {
	validateBackground(config);
	const previousBackground = scene.background,
		previousNode = scene.backgroundNode,
		previousEnvironment = scene.environment;
	const owned: { dispose(): void }[] = [];
	let update = (_camera: Camera, _delta: number) => {};
	let disposed = false;
	try {
		scene.backgroundNode = null;
		if (config.type === 'color') scene.background = new Color(config.color);
		if (config.type === 'gradient') {
			const top = uniform(new Color(config.top)),
				horizon = uniform(new Color(config.horizon)),
				bottom = uniform(new Color(config.bottom ?? config.horizon));
			const y = positionWorldDirection.y;
			scene.background = null;
			scene.backgroundNode = vec4(
				mix(mix(bottom, horizon, smoothstep(-1, 0, y)), top, smoothstep(0, 1, y)),
				1
			);
		}
		if (config.type === 'space') {
			scene.background = new Color(config.color ?? '#02040c');
			if (config.stars !== false) {
				const { createSpaceStars } = await import('./stars');
				const stars = createSpaceStars(config.stars);
				scene.add(stars.group);
				owned.push(stars);
			}
			if (config.sun) {
				const sun = new DirectionalLight(config.sun.color ?? '#fff3e4', config.sun.intensity ?? 3);
				sun.position.copy(
					new Vector3(...(config.sun.direction ?? SPACE_SUN_DIRECTION))
						.normalize()
						.multiplyScalar(100)
				);
				const ambient = new AmbientLight('#a3baff', config.sun.ambient ?? 0.08);
				scene.add(sun, sun.target, ambient);
				owned.push({
					dispose() {
						sun.removeFromParent();
						sun.target.removeFromParent();
						ambient.removeFromParent();
						sun.dispose();
						ambient.dispose();
					},
				});
			}
		}
		if (config.type === 'sky') {
			const { Sky } = await import('@pmndrs/sky');
			// sky 0.6 warms several shared-quad passes concurrently. Three r187's
			// graphics precompiler is not reentrant. Use its supported no-precompile
			// path and finish the first synchronous bake before the stage is shown.
			// This facade leaves the host renderer and its compile methods unchanged.
			const skyRenderer = new Proxy(renderer, {
				get(target, key) {
					if (key === 'compileAsync') return undefined;
					const value = Reflect.get(target, key, target);
					return typeof value === 'function' ? value.bind(target) : value;
				},
			});
			const sky = new Sky(skyRenderer, {
				preset: config.preset ?? 'earth',
				quality: config.quality ?? 'medium',
				timeOfDay: config.timeOfDay ?? 14,
				latitude: config.latitude ?? 37,
				exposure: config.exposure ?? 40,
				enableAerialPerspective: false,
			});
			owned.push(sky);
			sky.attach(scene);
			const sunlight = sky.createSun({ intensity: 2 });
			sunlight.attach(scene);
			owned.push(sunlight);
			if (config.stars !== false)
				sky.enableStars({
					count: config.stars?.count ?? 3500,
					seed: config.stars?.seed ?? 42,
					intensity: config.stars?.brightness ?? 1,
					size: config.stars?.size ?? 0.65,
					twinkle: 0,
				});
			let hours = config.timeOfDay ?? 14;
			update = (camera, delta) => {
				if (config.cycleDuration && delta > 0) {
					hours = (hours + (delta * 24) / config.cycleDuration) % 24;
					sky.setTimeOfDay(hours);
				}
				sky.update(camera);
			};
			update(camera, 0);
		}
		const assignedBackground = scene.background,
			assignedNode = scene.backgroundNode,
			assignedEnvironment = scene.environment;
		return {
			update(camera: Camera, delta = 0) {
				if (!disposed) update(camera, Math.max(0, Number.isFinite(delta) ? delta : 0));
			},
			dispose() {
				if (disposed) return;
				disposed = true;
				// Sky.dispose detaches from the scene. Preserve replacements installed
				// by another owner even when that detach clears the corresponding slot.
				const background =
						scene.background === assignedBackground ? previousBackground : scene.background,
					node = scene.backgroundNode === assignedNode ? previousNode : scene.backgroundNode,
					environment =
						scene.environment === assignedEnvironment ? previousEnvironment : scene.environment;
				for (const resource of owned.reverse()) resource.dispose();
				scene.background = background;
				scene.backgroundNode = node;
				scene.environment = environment;
			},
		};
	} catch (error) {
		for (const resource of owned.reverse()) resource.dispose();
		scene.background = previousBackground;
		scene.backgroundNode = previousNode;
		scene.environment = previousEnvironment;
		throw error;
	}
}
