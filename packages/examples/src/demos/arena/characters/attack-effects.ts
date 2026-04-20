import {
	AdditiveBlending,
	CanvasTexture,
	LinearFilter,
	SRGBColorSpace,
	type ColorRepresentation,
	type Texture,
} from 'three';
import {
	createParticleSystem,
	particlePresets,
	type ZylemParticleSystem,
} from '@zylem/game-lib';

/**
 * Lightweight authoring shape used by each character file to declare the
 * particle burst that accompanies an attack or special. Shipping as an
 * options bag (rather than a pre-built effect) keeps per-character data
 * declarative: colour, count, life, etc. are plain numbers in the character
 * file and the arena builds the actual {@link ZylemParticleSystem} on demand.
 */
export interface ParticleBurstSpec {
	/** Base preset. `burst` for sparks, `smoke` for slow drifting clouds. */
	kind?: 'burst' | 'smoke';
	/** Core colour; also used as the soft-circle texture colour by default. */
	color: ColorRepresentation;
	/** Number of particles emitted. */
	count?: number;
	/** Emitter duration (seconds). */
	duration?: number;
	/** Per-particle lifetime range (seconds). */
	life?: readonly [number, number];
	/** Initial speed range (units/sec). */
	speed?: readonly [number, number];
	/** Per-particle size range (world units). */
	size?: readonly [number, number];
	/**
	 * Optional override for the soft-circle texture colour. Defaults to
	 * `color`. Set to `null` to draw an untextured preset billboard.
	 */
	textureColor?: ColorRepresentation | null;
	/**
	 * World-space vertical offset applied when spawning the burst (meters
	 * above the actor's origin). Useful to lift an attack spark to torso
	 * height or drop a slam burst at the feet.
	 */
	yOffset?: number;
}

const textureCache = new Map<string, Texture>();

/**
 * Build (and cache) a soft-circle {@link CanvasTexture} tinted with the
 * given RGB hex. Using the same canvas pattern as the 3d-asteroids demo
 * keeps output consistent and avoids shipping bitmap assets for every
 * character + colour combination.
 */
export function makeSparkTexture(
	color: ColorRepresentation = '#ffffff',
): Texture {
	const key = String(color);
	const cached = textureCache.get(key);
	if (cached) return cached;

	const size = 128;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error(
			'Unable to acquire 2D canvas context for particle texture.',
		);
	}
	const center = size / 2;
	const hex = normalizeHex(color);
	const { r, g, b } = hexToRgb(hex);

	ctx.clearRect(0, 0, size, size);
	const gradient = ctx.createRadialGradient(
		center,
		center,
		4,
		center,
		center,
		center,
	);
	gradient.addColorStop(0, `rgba(255,255,255,0.95)`);
	gradient.addColorStop(0.25, `rgba(${r},${g},${b},0.82)`);
	gradient.addColorStop(0.6, `rgba(${r},${g},${b},0.36)`);
	gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(center, center, center, 0, Math.PI * 2);
	ctx.fill();

	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.minFilter = LinearFilter;
	texture.magFilter = LinearFilter;
	texture.needsUpdate = true;
	textureCache.set(key, texture);
	return texture;
}

interface StageAddTarget {
	add: (...entities: unknown[]) => void;
}

/**
 * Spawn a one-shot particle burst at a world-space position and return the
 * created {@link ZylemParticleSystem}. The system uses `autoDestroy: true`
 * so the engine removes the entity from the stage once the internal
 * three.quarks system finishes — callers don't need to track lifetime.
 *
 * `worldSpace: true` on the preset means particles keep their initial
 * world position after the parent entity is destroyed, so the burst stays
 * put even if the host actor keeps walking.
 */
export function spawnParticleBurst(
	stage: StageAddTarget,
	position: { x: number; y: number; z: number },
	spec: ParticleBurstSpec,
): ZylemParticleSystem {
	const kind = spec.kind ?? 'burst';
	const preset = kind === 'smoke' ? particlePresets.smoke : particlePresets.burst;
	const textureColor =
		spec.textureColor === null
			? undefined
			: (spec.textureColor ?? spec.color);

	const y = position.y + (spec.yOffset ?? 0);
	const effect = preset({
		color: spec.color,
		count: spec.count,
		duration: spec.duration,
		life: spec.life,
		speed: spec.speed,
		size: spec.size,
		worldSpace: true,
		...(textureColor !== undefined
			? {
				texture: makeSparkTexture(textureColor),
				blending: AdditiveBlending,
				depthWrite: false,
				alphaTest: 0.01,
			}
			: {}),
	});

	const system = createParticleSystem({
		position: { x: position.x, y, z: position.z },
		preset: effect,
		autoplay: false,
		followPosition: false,
		followRotation: false,
		autoDestroy: true,
	});

	stage.add(system);
	system.burst();
	return system;
}

function normalizeHex(color: ColorRepresentation): string {
	if (typeof color === 'string') {
		return color.startsWith('#') ? color : `#${color}`;
	}
	if (typeof color === 'number') {
		return `#${color.toString(16).padStart(6, '0')}`;
	}
	return '#ffffff';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace('#', '').trim();
	const expanded =
		clean.length === 3
			? clean
					.split('')
					.map((c) => c + c)
					.join('')
			: clean;
	const int = Number.parseInt(expanded, 16);
	if (Number.isNaN(int)) return { r: 255, g: 255, b: 255 };
	return {
		r: (int >> 16) & 0xff,
		g: (int >> 8) & 0xff,
		b: int & 0xff,
	};
}
