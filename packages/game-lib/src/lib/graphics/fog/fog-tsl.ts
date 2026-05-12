import type { Scene } from 'three';

import type { FogUniformValues } from './fog-patcher';

/**
 * WebGPU / TSL fog patcher -- placeholder for the eventual WebGPU migration.
 *
 * Mirrors the public surface of {@link ./fog-patcher.ts#FogMaterialPatcher}
 * so the fog entity can hand off without growing branching logic. Today
 * every method is a no-op: when the renderer is WebGPU and a fog is
 * attached, Three.js's stock fog applies but height/noise modulation does
 * not. The migration plan is roughly:
 *
 * 1. Compose a TSL `fog()` node from `density` / `near` / `far` + a
 *    `worldPosition.y`-driven height mask + a `noise3D(worldPosition)`
 *    modulator. The TSL `time` node already drives noise animation.
 * 2. Attach the composed node via `material.fogNode = ...` on every
 *    `MeshStandardNodeMaterial` / `MeshBasicNodeMaterial` in the scene.
 *    Track them in a Set so we can detach on cleanup just like the GLSL
 *    path does today.
 * 3. Add a renderer-detection helper (or read the active material's
 *    `isNodeMaterial` flag) so `ZylemFog` can pick the right patcher at
 *    runtime instead of hard-coding GLSL.
 *
 * Keep this stub in lockstep with the WebGL implementation -- any new
 * `FogUniformValues` field must be plumbed through here too so the future
 * swap is mechanical.
 */
export class FogTSLPatcher {
	private values: FogUniformValues;

	constructor(initial: FogUniformValues) {
		this.values = { ...initial };
	}

	setValues(next: Partial<FogUniformValues>): void {
		Object.assign(this.values, next);
	}

	tick(_delta: number): void {
		// Intentionally a no-op until TSL fog node composition lands.
	}

	scan(_scene: Scene): void {
		// Intentionally a no-op. TSL fog nodes are attached per-material
		// rather than via a global shader chunk replacement, so the
		// "scan the scene" pattern becomes "attach fogNode to every
		// NodeMaterial we don't already own".
	}

	unpatchAll(): void {
		// Intentionally a no-op until TSL fog node composition lands.
	}
}
