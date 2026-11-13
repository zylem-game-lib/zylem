import type { Camera, Scene } from 'three';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { ssao } from 'three/addons/tsl/display/SSAONode.js';
import {
	builtinAOContext,
	clamp,
	dot,
	exp,
	float,
	Fn,
	getViewPosition,
	length,
	max,
	mrt,
	normalView,
	pass,
	pow,
	projectionDepth,
	reference,
	rtt,
	screenUV,
	textureSize,
	uniform,
	uv,
	vec2,
} from 'three/tsl';
import { resolveAmbientOcclusion, type AmbientOcclusionOptions } from './config';
import { createCortao } from './cortao';

/** A depth/normal bilateral filter that reconstructs positions for either camera projection. */
function bilateral(
	input: any,
	depth: any,
	normal: any,
	camera: Camera,
	radius: number,
	horizontal: boolean
) {
	const inverseProjection = uniform(camera.projectionMatrixInverse);
	const near = reference('near', 'float', camera),
		far = reference('far', 'float', camera);
	const position = (p: any) =>
		getViewPosition(p, projectionDepth(depth.sample(p).r, near, far), inverseProjection);
	return Fn(() => {
		const center = uv();
		const centerPosition = position(center).toVar();
		const centerNormal = normal.sample(center).xyz.toVar();
		const step = (horizontal ? vec2(1, 0) : vec2(0, 1)).div(vec2(textureSize(input) as any));
		const sum = float(0).toVar(),
			total = float(0).toVar();
		for (let i = -2; i <= 2; i++) {
			const p = clamp(center.add(step.mul(i)), 0, 1);
			const spatial = Math.exp(-0.5 * i * i);
			const distance = length(position(p).sub(centerPosition));
			const normalWeight = pow(max(dot(centerNormal, normal.sample(p).xyz), 0), 8);
			const weight = exp(distance.div(radius).mul(-4)).mul(normalWeight).mul(spatial);
			sum.addAssign(input.sample(p).r.mul(weight));
			total.addAssign(weight);
		}
		return total.greaterThan(1e-6).select(sum.div(max(total, 1e-6)), input.sample(center).r);
	})();
}

/**
 * Build an AO lighting context plus its disposable prepasses.
 * Attach contextNode to a scene PassNode; call dispose when that graph is replaced.
 * With AO off this allocates no textures/passes. Standard lit materials receive AO
 * in their indirect-lighting term; transparent materials, sky and emission stay intact.
 */
export function createAmbientOcclusion(
	scene: Scene,
	camera: Camera,
	options?: AmbientOcclusionOptions,
	renderScale = 1
) {
	const config = resolveAmbientOcclusion(options);
	if (!config) return null;
	const resources: { dispose(): void }[] = [];
	try {
		const prepass = pass(scene, camera);
		prepass.setMRT(mrt({ output: normalView }));
		(prepass as any).setResolutionScale(renderScale);
		resources.push(prepass);
		const depth = prepass.getTextureNode('depth'),
			normal = prepass.getTextureNode('output');
		let signal: any;
		if (config.method === 'cortao') {
			const cortao = createCortao(depth, normal, camera, config);
			resources.push(cortao);
			signal = rtt(cortao.node, null, null, {
				resolutionScale: config.resolutionScale,
				depthBuffer: false,
			});
			resources.push(signal);
		} else {
			const effect =
				config.method === 'ssao' ? ssao(depth, normal, camera) : ao(depth, normal, camera);
			effect.radius.value = config.radius;
			effect.samples.value = config.samples;
			effect.resolutionScale = config.resolutionScale;
			// Use the same projection-aware filter for every method.
			if ('blurEnabled' in effect) effect.blurEnabled = false;
			resources.push(effect);
			signal = effect.getTextureNode();
		}
		if (config.denoise) {
			for (const horizontal of [true, false]) {
				signal = rtt(
					bilateral(signal, depth, normal, camera, config.radius, horizontal),
					null,
					null,
					{ resolutionScale: config.resolutionScale, depthBuffer: false }
				);
				resources.push(signal);
			}
		}
		const visibility = pow(clamp(signal.sample(screenUV).r, 0, 1), config.intensity);
		let disposed = false;
		return {
			contextNode: builtinAOContext(visibility),
			config,
			dispose() {
				if (disposed) return;
				disposed = true;
				for (const resource of resources.reverse()) resource.dispose();
			},
		};
	} catch (error) {
		for (const resource of resources.reverse()) resource.dispose();
		throw error;
	}
}
