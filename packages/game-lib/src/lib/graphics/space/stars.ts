/** Vacuum star sprites adapted from @pmndrs/sky SkyStars (MIT, Dennis Smolek).
 * Uses its seeded catalog and energy-normalized Gaussian profiles. See THIRD_PARTY_NOTICES.md.
 */
import { generateStarCatalog } from '@pmndrs/sky';
import {
	AdditiveBlending,
	DoubleSide,
	Group,
	InstancedBufferAttribute,
	InstancedBufferGeometry,
	Mesh,
	PlaneGeometry,
	Vector3,
	type Camera,
} from 'three';
import { SpriteNodeMaterial } from 'three/webgpu';
import {
	cameraProjectionMatrix,
	dot,
	exp,
	float,
	instancedBufferAttribute,
	max,
	mix,
	pow,
	screenSize,
	uniform,
	uv,
	varying,
	vec3,
	vec4,
} from 'three/tsl';
import type { StarOptions } from './background-config';

export function createSpaceStars(options: StarOptions = {}) {
	const catalog = generateStarCatalog({ count: options.count ?? 3500, seed: options.seed ?? 42 });
	const quad = new PlaneGeometry(1, 1);
	const geometry = new InstancedBufferGeometry();
	geometry.index = quad.index;
	geometry.setAttribute('position', quad.attributes.position);
	geometry.setAttribute('uv', quad.attributes.uv);
	geometry.instanceCount = catalog.count;
	quad.dispose();
	const directions = new InstancedBufferAttribute(catalog.directions, 3);
	const traits = new Float32Array(catalog.count * 2);
	for (let i = 0; i < catalog.count; i++) {
		traits[i * 2] = Math.pow(10, -0.4 * catalog.magnitudes[i]);
		traits[i * 2 + 1] = catalog.tones[i];
	}
	const traitAttribute = new InstancedBufferAttribute(traits, 2);
	geometry.setAttribute('starDirection', directions);
	geometry.setAttribute('starTraits', traitAttribute);
	const direction: any = instancedBufferAttribute(directions);
	const trait: any = instancedBufferAttribute(traitAttribute);
	const radius = uniform(1000),
		dpr = uniform(1);
	const energy = pow(trait.x, 0.75).mul((options.brightness ?? 1) * 10);
	const sigma = float(options.size ?? 0.65)
		.mul(dpr)
		.mul(pow(max(energy, 1), 0.15));
	const vSigma: any = varying(sigma);
	const offset = uv().sub(0.5).mul(vSigma.mul(6));
	const psf = exp(dot(offset, offset).negate().div(vSigma.mul(vSigma).mul(2))).div(
		vSigma.mul(vSigma).mul(2 * Math.PI)
	);
	const material = new SpriteNodeMaterial();
	material.positionNode = direction.mul(radius);
	material.sizeAttenuation = false;
	material.scaleNode = sigma
		.mul(6)
		.mul(float(2).div((cameraProjectionMatrix as any)[1].y.mul(screenSize.y)));
	material.colorNode = vec4(
		mix(vec3(1, 0.84, 0.7), vec3(0.75, 0.86, 1), varying(float(trait.y)))
			.mul(varying(float(energy)))
			.mul(psf),
		1
	);
	material.transparent = true;
	material.blending = AdditiveBlending;
	material.side = DoubleSide;
	material.forceSinglePass = true;
	material.depthWrite = false;
	material.fog = false;
	const mesh = new Mesh(geometry, material);
	mesh.frustumCulled = false;
	mesh.renderOrder = -10;
	const group = new Group();
	group.name = 'Zylem.SpaceStars';
	group.add(mesh);
	const cameraPosition = new Vector3();
	mesh.onBeforeRender = (renderer, _scene, camera) => {
		camera.getWorldPosition(cameraPosition);
		group.position.copy(cameraPosition);
		group.updateMatrixWorld(true);
		radius.value = Math.max(1, (camera as Camera & { far: number }).far * 0.9);
		dpr.value = renderer.getPixelRatio();
	};
	let disposed = false;
	return {
		group,
		dispose() {
			if (disposed) return;
			disposed = true;
			group.removeFromParent();
			geometry.dispose();
			material.dispose();
		},
	};
}
