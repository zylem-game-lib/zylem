/**
 * Runtime Shadertoy GLSL -> TSL transpilation (WebGPU).
 *
 * Wraps the three.js addons transpiler (`Transpiler` + `ShaderToyDecoder` +
 * `TSLEncoder`) as used in the official `webgpu_shadertoy` example, so raw
 * Shadertoy fragment code (`mainImage(out vec4 fragColor, in vec2 fragCoord)`)
 * can be turned into a consumable `ZylemTSLShader` at runtime.
 *
 * The encoder runs in IIFE mode: the generated code is a plain function
 * expression taking the TSL namespace, so no import maps or dynamic module
 * imports are required (bundler friendly).
 *
 * Supported Shadertoy inputs: `iTime`, `iResolution`, `fragCoord`. Shaders
 * relying on channels (`iChannel0`...), mouse, or multipass buffers are not
 * supported by the transpiler.
 */
import ShaderToyDecoder from 'three/addons/transpiler/ShaderToyDecoder.js';
import TSLEncoder from 'three/addons/transpiler/TSLEncoder.js';
import Transpiler from 'three/addons/transpiler/Transpiler.js';
import * as TSL from 'three/tsl';
import type { ZylemTSLShader } from '../types';

/**
 * Transpile Shadertoy GLSL into TSL JavaScript source.
 *
 * @param glsl Shadertoy fragment shader source (must define `mainImage`).
 * @param iife When true (default) the output is a function expression taking
 *             the TSL namespace; when false it is an ES module using
 *             `import ... from 'three/tsl'`.
 */
export function transpileShadertoy(glsl: string, iife = true): string {
	const decoder = new ShaderToyDecoder();
	const encoder = new TSLEncoder();
	encoder.iife = iife;
	return new Transpiler(decoder, encoder).parse(glsl);
}

/**
 * Parse Shadertoy GLSL and return the TSL `mainImage` node factory.
 * Each call to the returned function produces a fresh color node.
 */
export function parseShadertoyToNodeFactory(glsl: string): () => any {
	const jsCode = transpileShadertoy(glsl, true);
	// The IIFE output is a function expression `( function ( TSL, uniforms ) {...} )`.
	// Indirect eval keeps evaluation in global scope (same approach as the
	// official three.js webgpu_shadertoy example).
	const module = (0, eval)(jsCode)(TSL);
	if (!module || typeof module.mainImage !== 'function') {
		throw new Error(
			'parseShadertoy: transpiled shader does not define mainImage(). ' +
				'Make sure the source is a Shadertoy-style fragment shader.',
		);
	}
	return module.mainImage;
}

/**
 * Parse Shadertoy GLSL into a consumable {@link ZylemTSLShader}.
 *
 * ```ts
 * const shader = parseShadertoy(`
 *   void mainImage(out vec4 fragColor, in vec2 fragCoord) {
 *     vec2 uv = fragCoord.xy / iResolution.xy;
 *     fragColor = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
 *   }
 * `);
 * // material: { shader }
 * ```
 */
export function parseShadertoy(glsl: string): ZylemTSLShader {
	const mainImage = parseShadertoyToNodeFactory(glsl);
	return {
		colorNode: mainImage(),
		transparent: false,
	};
}
