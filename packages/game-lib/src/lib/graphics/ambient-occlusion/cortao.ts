/** CORTAO circular-occluder kernel adapted to TSL from CORTAO v1.0.0.
 * Copyright (c) 2026 Daniel Isheden, MIT; see THIRD_PARTY_NOTICES.md.
 * Uses full-precision depth/normals at mip 0, a 16-ray LUT, and static noise.
 * Packed mip prepasses, bent normals, and temporal reconstruction are not included.
 */
import {
	Data3DTexture,
	FloatType,
	NearestFilter,
	RedFormat,
	type Camera,
	type PerspectiveCamera,
} from 'three';
import {
	abs,
	clamp,
	cos,
	countOneBits,
	cross,
	dot,
	float,
	Fn,
	getScreenPositionFromClip,
	getViewPosition,
	If,
	interleavedGradientNoise,
	inverseSqrt,
	max,
	min,
	normalize,
	projectionDepth,
	reference,
	screenCoordinate,
	sin,
	sqrt,
	texture3D,
	textureSize,
	uint,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ResolvedAmbientOcclusion } from './config';
import {
	CORTAO_DIRECTION_SIZE,
	CORTAO_RADIUS_SIZE,
	CORTAO_RAYS,
	createCortaoLookupData,
	GOLDEN_ANGLE,
} from './cortao-lookup';

// TSL nodes carry vector-dependent operators that are erased by texture/pass interfaces.
export function createCortao(
	depthNode: any,
	normalNode: any,
	camera: Camera,
	options: ResolvedAmbientOcclusion
) {
	const lookup = new Data3DTexture(
		createCortaoLookupData(),
		CORTAO_DIRECTION_SIZE,
		CORTAO_DIRECTION_SIZE,
		CORTAO_RADIUS_SIZE
	);
	lookup.type = FloatType;
	lookup.format = RedFormat;
	lookup.minFilter = lookup.magFilter = NearestFilter;
	lookup.generateMipmaps = false;
	lookup.unpackAlignment = 1;
	lookup.needsUpdate = true;
	lookup.name = 'Zylem.CORTAO.Lookup';
	const lut = texture3D(lookup);
	const projection = uniform(camera.projectionMatrix);
	const inverseProjection: any = uniform(camera.projectionMatrixInverse);
	const near = reference('near', 'float', camera),
		far = reference('far', 'float', camera);
	const sampleDepth = (p: any) => projectionDepth(depthNode.sample(p).r, near, far);
	const basis = (n: any) => {
		const axis = abs(n.z)
			.lessThan(0.999)
			.select(vec3(0, 0, 1), vec3(0, 1, 0));
		const tangent = normalize(cross(axis, n)).toVar();
		return [tangent, cross(n, tangent).toVar()];
	};
	const node = Fn(() => {
		const centerUv = uv();
		const depth = sampleDepth(centerUv).toVar();
		const visibility = float(1).toVar();
		// Skip background/clip-plane depth for conventional and reversed depth buffers.
		If(depth.lessThan(1).and(depth.greaterThan(0)), () => {
			const normal = normalize(normalNode.sample(centerUv).xyz).toVar();
			const position = getViewPosition(centerUv, depth, inverseProjection).toVar();
			const linearDepth = position.z.negate().toVar();
			const perspective = (camera as PerspectiveCamera).isPerspectiveCamera === true;
			const viewDirection = (perspective ? normalize(position.negate()) : vec3(0, 0, 1)).toVar();
			const radius = float(options.radius).toVar();
			const circleRadius = float(options.radius).toVar();
			if (perspective) {
				const apparentLimit = abs(inverseProjection.element(1).y).mul(0.4);
				const coefficient = apparentLimit.div(sqrt(apparentLimit.mul(apparentLimit).add(1)));
				radius.assign(min(radius, linearDepth.mul(coefficient)));
				circleRadius.assign(
					radius
						.mul(linearDepth)
						.mul(inverseSqrt(max(linearDepth.mul(linearDepth).sub(radius.mul(radius)), 1e-8)))
				);
			}
			const pixelBias = abs(inverseProjection.element(0).x)
				.mul(Math.SQRT2)
				.div((textureSize(depthNode) as any).x)
				.mul(perspective ? linearDepth : float(1));
			position.addAssign(normal.mul(pixelBias));
			const noise = interleavedGradientNoise(screenCoordinate).toVar();
			const angle = noise.mul(2 * Math.PI).toVar();
			const dither = interleavedGradientNoise(screenCoordinate.add(vec2(17, 59))).toVar();
			const [right, up] = basis(viewDirection);
			const [t, b] = basis(normal);
			const rayAngle = dither.mul(2 * Math.PI);
			const tangent = t
				.mul(cos(rayAngle))
				.add(b.mul(sin(rayAngle)))
				.toVar();
			const bitangent = b
				.mul(cos(rayAngle))
				.sub(t.mul(sin(rayAngle)))
				.toVar();
			const rayBits = uint(0).toVar();
			for (let i = 0; i < options.samples; i++) {
				const inner = Math.pow(i / options.samples, 1.75),
					outer = Math.pow((i + 1) / options.samples, 1.75);
				const weight = Math.sqrt(outer * outer - inner * inner);
				const distance = dither
					.mul(outer - inner)
					.add(inner)
					.mul(circleRadius);
				const rotation = angle.add(i * GOLDEN_ANGLE);
				const offset = right
					.mul(cos(rotation))
					.add(up.mul(sin(rotation)))
					.mul(distance);
				const clip = projection.mul(vec4(position.add(offset), 1)).toVar();
				const sampleUv = getScreenPositionFromClip(clip).toVar();
				const inside = sampleUv.x
					.greaterThanEqual(0)
					.and(sampleUv.x.lessThan(1))
					.and(sampleUv.y.greaterThanEqual(0))
					.and(sampleUv.y.lessThan(1))
					.and(clip.w.greaterThan(0));
				If(inside, () => {
					const sampleZ = sampleDepth(sampleUv).toVar();
					const delta = getViewPosition(sampleUv, sampleZ, inverseProjection).sub(position).toVar();
					const lengthSquared = dot(delta, delta).toVar();
					If(
						sampleZ
							.lessThan(1)
							.and(sampleZ.greaterThan(0))
							.and(lengthSquared.lessThan(radius.mul(radius)))
							.and(lengthSquared.greaterThan(1e-10))
							.and(dot(delta, normal).greaterThan(0)),
						() => {
							const inverseLength = inverseSqrt(lengthSquared).toVar();
							const direction = delta.mul(inverseLength).toVar();
							const sampleNormal = normalize(normalNode.sample(sampleUv).xyz).toVar();
							const slope = inverseSqrt(max(dot(sampleNormal, viewDirection), 0.25)).toVar();
							const occluderRadius = radius.mul(weight).mul(slope).mul(inverseLength).toVar();
							If(dot(sampleNormal, direction).lessThan(0.5), () => {
								const adjustedOffset = occluderRadius
									.negate()
									.div(max(float(1).sub(occluderRadius.mul(occluderRadius).mul(0.5)), 1e-6));
								direction.assign(normalize(direction.add(sampleNormal.mul(adjustedOffset))));
							}).Else(() => {
								occluderRadius.mulAssign(slope.add(1).mul(0.5));
							});
							const hemisphere = vec3(
								dot(direction, tangent),
								dot(direction, bitangent),
								dot(direction, normal)
							).toVar();
							If(hemisphere.z.greaterThan(-0.99), () => {
								const sphereMap = hemisphere.xy
									.mul(inverseSqrt(hemisphere.z.mul(8).add(8)))
									.add(0.5);
								const lookupUv = clamp(
									vec3(sphereMap, occluderRadius.mul(Math.SQRT1_2)),
									0,
									0.999999
								);
								rayBits.assign(rayBits.bitOr(uint(lut.sample(lookupUv).level(float(0)).r)));
							});
						}
					);
				});
			}
			visibility.assign(float(1).sub(float(countOneBits(rayBits) as any).div(CORTAO_RAYS)));
		});
		return visibility;
	})();
	return { node, dispose: () => lookup.dispose() };
}
