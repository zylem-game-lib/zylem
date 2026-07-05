/**
 * Stylized foliage shader in TSL (WebGPU).
 *
 * Port of the vanilla-three "stylized bush" foliage material: leaf quads are
 * collapsed to points in the geometry and expanded toward the camera in the
 * vertex stage (spherical billboarding), swayed by procedural wind, then cut
 * out with a leaf-shaped alpha mask and shaded with a bottom→top color ramp
 * plus a fresnel rim.
 *
 * Geometry contract: every leaf is a quad whose four vertices share the SAME
 * position (the leaf center) with corner UVs (0,0)/(1,0)/(0,1)/(1,1) — use
 * {@link createFoliageClusterGeometry} or author a mesh the same way (as the
 * original's bush.glb does). Leaf centers should sit at y >= 0 (the color
 * ramp and wind mask read local Y).
 *
 * The alpha mask is procedural by default; pass `alphaMask` (a texture whose
 * red channel is the leaf core and green channel an outer skirt blended in
 * with distance) to reproduce the original exactly.
 */
import { Color, type ColorRepresentation, type Texture } from 'three';
import {
	Discard,
	Fn,
	cameraPosition,
	clamp,
	cos,
	cross,
	float,
	fract,
	length,
	max,
	min,
	mix,
	modelWorldMatrix,
	normalLocal,
	normalize,
	positionLocal,
	pow,
	sin,
	smoothstep,
	step,
	texture,
	time,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import { type TSLFn, valueNoise2d } from './utils.tsl';

export interface FoliageOptions {
	/** Leaf color at the top of the bush. Default leaf green */
	topColor?: ColorRepresentation;
	/** Leaf color at the base. Default deep green */
	bottomColor?: ColorRepresentation;
	/** Fresnel rim tint. Default yellow-green */
	fresnelColor?: ColorRepresentation;
	/** Fresnel rim strength (0-2, negative inverts toward albedo). Default 0.5 */
	fresnelStrength?: number;
	/** Spatial scale of the wind waves. Default 1 */
	windScale?: number;
	/** Wind sway amplitude. Default 5 */
	windStrength?: number;
	/** How quickly sway builds up with height. Default 5 */
	windDensity?: number;
	/** Leaf quad size in local units (sign flips facing variation). Default 0.35 */
	leafScale?: number;
	/** Height of the bottom→top color ramp (1 / bush height). Default 0.3 */
	colorRamp?: number;
	/** Per-leaf rotation variation of the quad corners. Default 1 */
	faceRotationVariation?: number;
	/** Animation speed multiplier. Default 1 */
	speed?: number;
	/**
	 * Optional leaf alpha mask texture (red = core, green = distance skirt).
	 * Replaces the procedural leaf shape. Baked at creation.
	 */
	alphaMask?: Texture;
	/** Distance at which leaves start growing/backfilling. Default 0 */
	distanceStart?: number;
	/** Distance range over which the effect ramps in. Default 70 */
	distanceRange?: number;
	/** How much leaves grow with distance (LOD backfill). Default 0.5 */
	distanceScale?: number;
}

export interface FoliageUniforms {
	topColor: { value: Color };
	bottomColor: { value: Color };
	fresnelColor: { value: Color };
	fresnelStrength: { value: number };
	windScale: { value: number };
	windStrength: { value: number };
	windDensity: { value: number };
	leafScale: { value: number };
	colorRamp: { value: number };
	faceRotationVariation: { value: number };
	speed: { value: number };
	[key: string]: { value: any };
}

/**
 * Create a stylized foliage shader. Colors, wind, and leaf parameters are
 * runtime uniforms; the alpha mask and distance-LOD options are baked.
 */
export function createFoliage(
	options: FoliageOptions = {},
): ZylemParameterizedShader<FoliageUniforms> {
	const uTopColor = uniform(new Color(options.topColor ?? '#3e7833'));
	const uBottomColor = uniform(new Color(options.bottomColor ?? '#21543f'));
	const uFresnelColor = uniform(new Color(options.fresnelColor ?? '#94a654'));
	const uFresnelStrength = uniform(options.fresnelStrength ?? 0.5);
	const uWindScale = uniform(options.windScale ?? 1.0);
	const uWindStrength = uniform(options.windStrength ?? 5.0);
	const uWindDensity = uniform(options.windDensity ?? 5.0);
	const uLeafScale = uniform(options.leafScale ?? 0.35);
	const uColorRamp = uniform(options.colorRamp ?? 0.3);
	const uFaceRotationVariation = uniform(options.faceRotationVariation ?? 1.0);
	const uSpeed = uniform(options.speed ?? 1.0);

	const distanceStart = options.distanceStart ?? 0.0;
	const distanceRange = options.distanceRange ?? 70.0;
	const distanceScale = options.distanceScale ?? 0.5;
	const alphaMask = options.alphaMask;

	/**
	 * LOD influence: 0 up close, 1 far away. The original intended distance
	 * scaling (its `length(viewDir)` of a normalized vector was a no-op);
	 * this implements the intent.
	 */
	const influence: TSLFn = Fn(() => {
		const worldPos = (modelWorldMatrix as any).mul(vec4(positionLocal, 1.0)).xyz;
		const dist = length(cameraPosition.sub(worldPos));
		return smoothstep(distanceStart, distanceStart + distanceRange, dist);
	});

	// Vertex stage: expand the collapsed leaf quad toward the camera
	// (spherical billboard) and add wind sway.
	const positionNode = Fn(() => {
		const t = time.mul(uSpeed);
		const uvCoord = uv();
		const worldPos = (modelWorldMatrix as any).mul(vec4(positionLocal, 1.0)).xyz;

		// Per-corner rotation variation, as in the original
		const angle = float(6.248).mul(uvCoord.x).mul(uFaceRotationVariation);
		const grow = float(1.0).add(influence().mul(distanceScale));
		const s0 = uvCoord.sub(0.5).mul(2.0).mul(uLeafScale).mul(grow);
		const s = vec2(
			s0.x.mul(cos(angle)).sub(s0.y.mul(sin(angle))),
			s0.x.mul(sin(angle)).add(s0.y.mul(cos(angle))),
		);

		// Billboard axes from the leaf's world position
		const forward = normalize(cameraPosition.sub(worldPos));
		const right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
		const up = cross(forward, right);
		const cameraOffset = right.mul(s.x).add(up.mul(s.y));

		// Wind sway (faithful port of the original's begin_vertex block)
		const positionalInfluence = positionLocal.x
			.negate()
			.add(positionLocal.z)
			.sub(worldPos.x)
			.add(worldPos.z);
		const offset0 = fract(positionalInfluence.div(uWindScale).add(t.mul(0.001)));
		const offset = min(offset0, float(1.0).sub(offset0)).mul(2.0);

		const t2 = t.add(
			sin(
				t
					.add(offset)
					.add(cos(t.add(offset.mul(uWindStrength).mul(2.0))).mul(uWindStrength)),
			),
		);
		const windMask = clamp(positionLocal.y.mul(uWindDensity), 0.0, 1.0);
		const w = positionLocal
			.mul(windMask)
			.div(20.0)
			.mul(uWindStrength)
			.mul(offset);
		const windOffset = vec3(w.x.mul(sin(t2)), w.y.mul(sin(t2)), w.z.mul(cos(t2)));

		return positionLocal.add(cameraOffset).add(windOffset);
	})();

	const colorNode = Fn(() => {
		const uvCoord = uv();

		// Leaf cutout: texture mask when provided, procedural leafy blob
		// otherwise (noise-wobbled disk; core + skirt mimic the r/g channels)
		let core: any;
		let skirt: any;
		if (alphaMask) {
			const mask = texture(alphaMask, uvCoord) as any;
			core = mask.r;
			skirt = mask.g;
		} else {
			const wobble = valueNoise2d(uvCoord.mul(6.0)).sub(0.5).mul(0.4);
			const d = length(uvCoord.sub(0.5)).mul(2.0).add(wobble);
			core = step(d as any, 0.72);
			skirt = step(d as any, 0.95).sub(core);
		}
		const alpha = core.add(skirt.mul(influence()));
		Discard(alpha.lessThan(1.0));

		// Bottom→top albedo ramp from the leaf center height
		const ramp = positionLocal.y.mul(uColorRamp);
		const albedo = mix(vec3(uBottomColor as any), vec3(uTopColor as any), ramp);

		// Fresnel rim (faithful to the original's quirky camera-direction dot)
		const fresnel = pow(
			max(dot3(normalize(normalLocal), normalize(cameraPosition)), 0.0),
			3.0,
		);
		const emissive = mix(albedo, vec3(uFresnelColor as any), uFresnelStrength)
			.mul(fresnel)
			.mul(max(float(0.1), ramp));

		return vec4(albedo.add(emissive), 1.0);
	})();

	return {
		colorNode,
		positionNode,
		transparent: false,
		uniforms: {
			topColor: uTopColor,
			bottomColor: uBottomColor,
			fresnelColor: uFresnelColor,
			fresnelStrength: uFresnelStrength,
			windScale: uWindScale,
			windStrength: uWindStrength,
			windDensity: uWindDensity,
			leafScale: uLeafScale,
			colorRamp: uColorRamp,
			faceRotationVariation: uFaceRotationVariation,
			speed: uSpeed,
		},
	};
}

/** dot() with loose typing (TSL's dot overloads reject mixed node inference). */
function dot3(a: any, b: any): any {
	return a.dot(b);
}
