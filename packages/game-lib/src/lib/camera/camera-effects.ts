import type { Camera } from 'three';
import type { ZylemPostEffect } from './renderer-manager';

/** Options for a camera effect. Setting `enabled` to false bypasses the pass. */
export interface PassOptions {
	enabled?: boolean;
	[option: string]: unknown;
}

/**
 * A TSL post-processing pass or an existing Zylem shader effect. A configurable
 * pass builds its output from the incoming node and its current options.
 */
export type Pass<Options extends object = PassOptions> = ZylemPostEffect | {
	options: Options;
	apply(input: Parameters<ZylemPostEffect>[0], context: Parameters<ZylemPostEffect>[1], options: Readonly<Options>): ReturnType<ZylemPostEffect>;
};

interface EffectEntry {
	options: PassOptions;
	apply: (input: Parameters<ZylemPostEffect>[0], context: Parameters<ZylemPostEffect>[1], options: PassOptions) => ReturnType<ZylemPostEffect>;
}

const cameraEffects = new WeakMap<Camera, CameraEffects>();

export function effectsForCamera(camera: Camera): CameraEffects | undefined {
	return cameraEffects.get(camera);
}

/** The effect configuration belongs to the camera. The renderer owns the compiled nodes. */
export class CameraEffects {
	private readonly entries = new Map<string, EffectEntry>();
	revision = 0;

	bind(camera: Camera): void {
		cameraEffects.set(camera, this);
	}

	get active(): boolean {
		for (const entry of this.entries.values()) {
			if (entry.options.enabled !== false) return true;
		}
		return false;
	}

	add<Options extends object>(key: string, effect: Pass<Options>): void {
		const options: PassOptions = {};
		if (typeof effect !== 'function') Object.assign(options, effect.options);
		const apply: EffectEntry['apply'] = typeof effect === 'function'
			? effect
			: (input, context, current) => effect.apply(input, context, current as Options);
		this.entries.set(key, { options, apply });
		this.revision++;
	}

	update(key: string, options: PassOptions): boolean {
		const entry = this.entries.get(key);
		if (!entry) return false;
		entry.options = { ...entry.options, ...options };
		this.revision++;
		return true;
	}

	remove(key: string): boolean {
		if (!this.entries.delete(key)) return false;
		this.revision++;
		return true;
	}

	compose(
		input: Parameters<ZylemPostEffect>[0],
		context: Parameters<ZylemPostEffect>[1],
		resources: Set<{ dispose(): void }>,
	): ReturnType<ZylemPostEffect> {
		let node = input;
		for (const [key, entry] of this.entries) {
			if (entry.options.enabled === false) continue;
			try {
				const output = entry.apply(node, context, entry.options);
				if (output !== node && output !== context.scenePass && typeof output?.dispose === 'function') {
					resources.add(output);
				}
				node = output;
			} catch (error) {
				console.error(`Camera effect "${key}" failed.`, error);
			}
		}
		return node;
	}
}
