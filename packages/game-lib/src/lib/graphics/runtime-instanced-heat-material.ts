import { Color, LinearSRGBColorSpace } from 'three';
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { attribute, clamp, mix, vec3 } from 'three/tsl';

/** Geometry attribute name; read per-instance via the TSL `attribute(...)` node. */
export const RUNTIME_INSTANCE_HEAT_ATTRIBUTE = 'instanceHeat';

/**
 * Default hot-end color for collision heat tint (matches previous JS `Color.lerp` target).
 */
export const RUNTIME_HEAT_TINT_HOT_HEX = 0xff6b3d;

/**
 * Drives a per-instance heat tint on a {@link MeshStandardNodeMaterial} (WebGPU).
 *
 * Replaces the legacy WebGL `onBeforeCompile` GLSL chunk injection: the albedo
 * becomes `mix(base, hot, heat)` where `heat` is read per-instance from the
 * {@link RUNTIME_INSTANCE_HEAT_ATTRIBUTE} instanced buffer attribute. The base
 * color is sampled from the material's current `color` (linear) so the tint
 * stacks on the configured batch color.
 *
 * Note: this overrides `colorNode`, so it intentionally ignores any albedo
 * map — runtime collision batches are flat-colored fragments.
 */
export function applyMeshStandardRuntimeHeatTint(
	material: MeshStandardNodeMaterial,
	hotColor: Color,
): void {
	const hotRgb = { r: 0, g: 0, b: 0 };
	hotColor.getRGB(hotRgb, LinearSRGBColorSpace);

	const baseRgb = { r: 0, g: 0, b: 0 };
	material.color.getRGB(baseRgb, LinearSRGBColorSpace);

	// Pass the explicit `'float'` type argument so the attribute node is typed
	// as `Node<"float">` rather than `Node<string>`; the latter expands the TSL
	// proxy into a union large enough to trip the native compiler (TS2590).
	const heat = clamp(attribute<'float'>(RUNTIME_INSTANCE_HEAT_ATTRIBUTE, 'float'), 0.0, 1.0);
	const base = vec3(baseRgb.r, baseRgb.g, baseRgb.b);
	const hot = vec3(hotRgb.r, hotRgb.g, hotRgb.b);

	material.colorNode = mix(base, hot, heat);
	material.needsUpdate = true;
}
