import { AdditiveBlending, Color, type Material } from 'three';
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import {
	color,
	float,
	normalLocal,
	normalView,
	positionGeometry,
	positionViewDirection,
	vec4,
} from 'three/tsl';

/**
 * Inexpensive fresnel glow for an entity material.
 *
 * This is one extra term in the material shader. It does not add a bloom
 * pass or a second mesh.
 */
export interface EntityGlowOptions {
	/** Glow color. Defaults to the material color, then white. */
	color?: Color | string;
	/** Brightness multiplier. Default `2.8`. */
	intensity?: number;
	/**
	 * How far a flat-color glow extends past the surface, in local units.
	 * `0` keeps the mesh size. Default `0.06`. Ignored when glow is added
	 * as emissive light on a textured or custom-shader material.
	 */
	size?: number;
	/**
	 * How quickly brightness falls toward the silhouette.
	 * Higher values keep the hot core tighter. Default `1.6`.
	 */
	falloff?: number;
}

export interface ResolvedEntityGlow {
	color: Color | string;
	intensity: number;
	size: number;
	falloff: number;
}

/**
 * Normalize `material.glow` into concrete shader inputs.
 * `true` uses the defaults and the material color.
 */
export function resolveEntityGlow(
	glow: boolean | EntityGlowOptions | undefined,
	fallbackColor?: Color,
): ResolvedEntityGlow | null {
	if (!glow) {
		return null;
	}

	const options = glow === true ? {} : glow;
	return {
		color: options.color ?? fallbackColor ?? '#ffffff',
		intensity: options.intensity ?? 2.8,
		size: options.size ?? 0.06,
		falloff: options.falloff ?? 1.6,
	};
}

function glowColorInput(value: Color | string): string {
	return typeof value === 'string' ? value : `#${value.getHexString()}`;
}

/**
 * View-facing amount: `1` on surfaces aimed at the camera, `0` at the silhouette.
 */
function facingAmount() {
	return normalView.dot(positionViewDirection).abs().saturate();
}

/**
 * Unlit additive glow. Bright at the center and faded at a slightly expanded
 * silhouette, so a small mesh reads as a soft halo in a single draw.
 */
export function createEntityGlowMaterial(
	options: ResolvedEntityGlow,
): MeshBasicNodeMaterial {
	const facing = facingAmount();
	const strength = facing.pow(float(options.falloff));
	const rgb = color(glowColorInput(options.color))
		.mul(float(options.intensity))
		.mul(strength);
	const material = new MeshBasicNodeMaterial();
	material.colorNode = vec4(rgb, strength);
	if (options.size > 0) {
		const shell = facing.oneMinus().add(0.2);
		material.positionNode = positionGeometry.add(
			normalLocal.mul(float(options.size).mul(shell)),
		);
	}
	material.transparent = true;
	material.blending = AdditiveBlending;
	material.depthWrite = false;
	material.toneMapped = false;
	material.needsUpdate = true;
	return material;
}

/**
 * Add a fresnel emissive term to an existing node material.
 * The original color, texture, or shader stays in place.
 */
export function applyEntityGlow(
	material: Material,
	options: ResolvedEntityGlow,
): void {
	if (!(material instanceof MeshStandardNodeMaterial) && !(material instanceof MeshBasicNodeMaterial)) {
		return;
	}

	const facing = facingAmount();
	const rim = facing.oneMinus().pow(float(options.falloff));
	// MeshBasicNodeMaterial inherits emissiveNode at runtime, but the
	// published types only declare it on the lit node materials.
	const emissiveMaterial = material as Material & {
		emissiveNode: unknown;
	};
	emissiveMaterial.emissiveNode = color(glowColorInput(options.color))
		.mul(float(options.intensity))
		.mul(rim.add(0.2));
	material.needsUpdate = true;
}
