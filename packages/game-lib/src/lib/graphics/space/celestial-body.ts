import { GravitySourceBehavior, resolveGravitySource } from '@zylem/behaviors/celestial';
import { sphereCollision } from '../../entities/primitives/parts/collision-factories';
import { Vector3 } from 'three';
import type { SetupContext, UnloadContext, UpdateContext } from '../../core/base-node-life-cycle';
import {
	finalizeEntityCloneSupport,
	GameEntity,
} from '../../entities/entity';
import { normalizeVec3, VEC3_ZERO } from '../../core/vector';
import { resolveCelestialBody, type CelestialBodyOptions } from './celestial-body-config';
import { createCelestialBodyVisual } from './celestial-body-visual';

/** Independent body with an owned visual, spherical collider, and optional gravity source. */
export class ZylemCelestialBody extends GameEntity<CelestialBodyOptions> {
	private visual: ReturnType<typeof createCelestialBodyVisual> | null = null;
	private elapsed = 0;
	private timeScale = 1;
	readonly bodyOptions: CelestialBodyOptions;
	constructor(options: CelestialBodyOptions = {}) {
		super();
		resolveCelestialBody(options);
		this.bodyOptions = structuredClone(options);
		this.options = {
			...this.bodyOptions,
			name: options.name ?? 'Celestial body',
			position: normalizeVec3(options.position, VEC3_ZERO),
		};
		const radius = resolveCelestialBody(options).radius;
		this.add(
			sphereCollision({
				radius,
				static: options.motion !== 'dynamic',
				gravityScale: 0,
				lockRotations: true,
				lockTranslations: false,
			})
		);
		if (options.gravity) {
			resolveGravitySource({ ...options.gravity, radius });
			this.use(GravitySourceBehavior, { ...options.gravity, radius });
		}
	}
	override clone(overrides?: Partial<CelestialBodyOptions>): this {
		const clone = super.clone(overrides);
		const ref = clone.getBehaviorHandle(GravitySourceBehavior)?.ref;
		if (ref && clone.bodyOptions.gravity)
			ref.options = {
				...clone.bodyOptions.gravity,
				radius: resolveCelestialBody(clone.bodyOptions).radius,
			};
		return clone;
	}
	override create(): this {
		super.create();
		if (!this.visual) {
			this.visual = createCelestialBodyVisual(this.bodyOptions);
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
		this.bodyOptions.sunDirection = [...direction];
		this.visual?.setSunDirection(vector);
	}
	/** Playback rate for the surface and clouds; 0 pauses them. */
	setTimeScale(scale: number): void {
		if (!Number.isFinite(scale) || scale < 0)
			throw new Error('Body time scale must be finite and nonnegative.');
		this.timeScale = scale;
	}
	/** Sample an absolute animation time, useful for editor scrubbing. */
	setTime(seconds: number): void {
		if (!Number.isFinite(seconds) || seconds < 0)
			throw new Error('Body time must be finite and nonnegative.');
		this.elapsed = seconds;
		this.visual?.update(seconds);
	}
	protected override _unload(context: UnloadContext<this>) {
		this.visual?.dispose();
		this.visual = null;
		super._unload(context);
		this.group = undefined;
		this.mesh = undefined;
	}
}
export function createCelestialBody(options: CelestialBodyOptions = {}): ZylemCelestialBody {
	const body = new ZylemCelestialBody(options);
	return finalizeEntityCloneSupport(body, (overrides) => {
		// The base clone operation then copies the source's behaviors over the
		// ones the constructor declared.
		return createCelestialBody({ ...body.bodyOptions, ...overrides });
	});
}
