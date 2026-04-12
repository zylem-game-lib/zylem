import { Color, LinearSRGBColorSpace, MeshStandardMaterial, Vector3 } from 'three';

/** Geometry attribute name; must match GLSL `attribute float instanceHeat`. */
export const RUNTIME_INSTANCE_HEAT_ATTRIBUTE = 'instanceHeat';

const UNIFORM_HOT = 'uRuntimeHeatHot';

/**
 * Default hot-end color for collision heat tint (matches previous JS `Color.lerp` target).
 */
export const RUNTIME_HEAT_TINT_HOT_HEX = 0xff6b3d;

/**
 * Injects per-instance heat into {@link MeshStandardMaterial} via `onBeforeCompile`.
 * Target: Three.js r180 shader chunks (`common`, `begin_vertex`, `color_fragment`); recheck on upgrades.
 *
 * Albedo after `color_fragment` becomes `mix(diffuse, hot, heat)` so maps and lighting stay intact.
 */
export function applyMeshStandardRuntimeHeatTint(
	material: MeshStandardMaterial,
	hotColor: Color,
): void {
	const hotRgb = { r: 0, g: 0, b: 0 };
	hotColor.getRGB(hotRgb, LinearSRGBColorSpace);
	const hotLinear = new Vector3(hotRgb.r, hotRgb.g, hotRgb.b);

	material.vertexColors = false;
	material.customProgramCacheKey = () => 'runtimeHeat';

	material.onBeforeCompile = (shader) => {
		shader.uniforms[UNIFORM_HOT] = { value: hotLinear.clone() };

		shader.vertexShader = shader.vertexShader.replace(
			'#include <common>',
			`#include <common>
attribute float ${RUNTIME_INSTANCE_HEAT_ATTRIBUTE};
varying float vInstanceHeat;`,
		);

		shader.vertexShader = shader.vertexShader.replace(
			'#include <begin_vertex>',
			`vInstanceHeat = ${RUNTIME_INSTANCE_HEAT_ATTRIBUTE};
#include <begin_vertex>`,
		);

		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <common>',
			`#include <common>
uniform vec3 ${UNIFORM_HOT};
varying float vInstanceHeat;`,
		);

		shader.fragmentShader = shader.fragmentShader.replace(
			'#include <color_fragment>',
			`#include <color_fragment>
diffuseColor.rgb = mix( diffuseColor.rgb, ${UNIFORM_HOT}, clamp( vInstanceHeat, 0.0, 1.0 ) );`,
		);
	};
}
