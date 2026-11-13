/** Screen-space ambient occlusion, owned by the stage's graphics pipeline. */
export type AmbientOcclusionMethod = 'ssao' | 'gtao' | 'cortao';
export type AmbientOcclusionQuality = 'low' | 'medium' | 'high';
export interface AmbientOcclusionSettings {
	method: AmbientOcclusionMethod;
	quality?: AmbientOcclusionQuality;
	/** Maximum sampling radius in world units. Default 1. */
	radius?: number;
	/** Visibility exponent. Zero disables AO. Default 1. */
	intensity?: number;
	/** Fraction of drawing-buffer resolution. Default 0.5 (low/medium), 1 (high). */
	resolutionScale?: number;
	/** Depth/normal-aware spatial filtering; no temporal history. Default true. */
	denoise?: boolean;
}
export type AmbientOcclusionOptions = false | AmbientOcclusionSettings;
export interface ResolvedAmbientOcclusion extends Required<AmbientOcclusionSettings> {
	samples: number;
}
const PRESETS = {
	low: { samples: 8, resolutionScale: 0.5 },
	medium: { samples: 16, resolutionScale: 0.5 },
	high: { samples: 32, resolutionScale: 1 },
} as const;

/** Validate at configuration time so invalid options never reach a shader. */
export function resolveAmbientOcclusion(
	options?: AmbientOcclusionOptions
): ResolvedAmbientOcclusion | null {
	if (options === undefined || options === false) return null;
	if (!options || !['ssao', 'gtao', 'cortao'].includes(options.method))
		throw new Error('Unknown ambient occlusion method. Use ssao, gtao, cortao, or false.');
	const quality = options.quality ?? 'medium';
	if (!Object.hasOwn(PRESETS, quality))
		throw new Error('Unknown ambient occlusion quality. Use low, medium, or high.');
	const radius = options.radius ?? 1;
	const intensity = options.intensity ?? 1;
	const resolutionScale = options.resolutionScale ?? PRESETS[quality].resolutionScale;
	if (!Number.isFinite(radius) || radius <= 0)
		throw new Error('Ambient occlusion radius must be positive and finite.');
	if (!Number.isFinite(intensity) || intensity < 0)
		throw new Error('Ambient occlusion intensity must be nonnegative and finite.');
	if (!Number.isFinite(resolutionScale) || resolutionScale <= 0 || resolutionScale > 1)
		throw new Error('Ambient occlusion resolutionScale must be in (0, 1].');
	if (options.denoise !== undefined && typeof options.denoise !== 'boolean')
		throw new Error('Ambient occlusion denoise must be boolean.');
	if (intensity === 0) return null;
	return {
		method: options.method,
		quality,
		radius,
		intensity,
		resolutionScale,
		denoise: options.denoise ?? true,
		samples: PRESETS[quality].samples,
	};
}
