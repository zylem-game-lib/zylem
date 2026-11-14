import { Vector3 } from 'three';
import type { CleanupContext, SetupContext, UpdateContext } from '../../core/base-node-life-cycle';
import {
	finalizeEntityCloneSupport,
	GameEntity,
	type GameEntityOptions,
} from '../../entities/entity';
import { normalizeVec3, VEC3_ZERO } from '../../core/vector';
import { resolvePlanet, type PlanetOptions } from './planet-config';
import { createPlanetVisual } from './planet-visual';

/** A visual planet, its rings and moons; no physics bodies are allocated. */
export class ZylemPlanet extends GameEntity<GameEntityOptions> {
	private visual: ReturnType<typeof createPlanetVisual> | null = null;
	private elapsed = 0;
	private timeScale = 1;
	readonly planetOptions: PlanetOptions;
	constructor(options: PlanetOptions = {}) {
		super();
		resolvePlanet(options);
		this.planetOptions = structuredClone(options);
		this.options = {
			name: options.name ?? 'Planet',
			position: normalizeVec3(options.position, VEC3_ZERO),
		};
	}
	override create(): this {
		super.create();
		if (!this.visual) {
			this.visual = createPlanetVisual(this.planetOptions);
			this.group = this.visual.group;
			this.mesh = this.visual.surface;
		}
		return this;
	}
	override _setup(context: SetupContext<this>) {
		super._setup(context);
		this.elapsed = 0;
		this.visual?.update(0);
	}
	override _update(context: UpdateContext<this>) {
		super._update(context);
		if (Number.isFinite(context.delta)) this.elapsed += Math.max(0, context.delta) * this.timeScale;
		this.visual?.update(this.elapsed);
	}
	/** Update visual shadow direction to match a moving scene sun. */
	setSunDirection(direction: [number, number, number]): void {
		const vector = new Vector3(...direction);
		if (!direction.every(Number.isFinite) || vector.lengthSq() < 1e-12)
			throw new Error('Sun direction must be nonzero and finite.');
		this.planetOptions.sunDirection = [...direction];
		this.visual?.setSunDirection(vector);
	}
	/** Playback rate for the surface, clouds and moon orbits; 0 pauses them. */
	setTimeScale(scale: number): void {
		if (!Number.isFinite(scale) || scale < 0)
			throw new Error('Planet time scale must be finite and nonnegative.');
		this.timeScale = scale;
	}
	/** Sample an absolute animation time, useful for editor scrubbing. */
	setTime(seconds: number): void {
		if (!Number.isFinite(seconds) || seconds < 0)
			throw new Error('Planet time must be finite and nonnegative.');
		this.elapsed = seconds;
		this.visual?.update(seconds);
	}
	protected override _cleanup(context: CleanupContext<this>) {
		this.visual?.dispose();
		this.visual = null;
		super._cleanup(context);
		this.group = undefined;
		this.mesh = undefined;
	}
}
export function createPlanet(options: PlanetOptions = {}): ZylemPlanet {
	const planet = new ZylemPlanet(options);
	return finalizeEntityCloneSupport(planet, (overrides) =>
		createPlanet({ ...planet.planetOptions, ...overrides })
	);
}
