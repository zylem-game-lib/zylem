import {
	Color,
	ColorRepresentation,
	Group,
	Raycaster,
	type Intersection,
	Vector3,
} from 'three';
import { Line2NodeMaterial } from 'three/webgpu';
import { Line2 } from 'three/addons/lines/webgpu/Line2.js';
import { BaseNode } from '../core/base-node';
import {
	finalizeEntityCloneSupport,
	GameEntity,
	type GameEntityOptions,
} from './entity';
import { mergeArgs, commonDefaults } from './common';
import { DebugDelegate } from './delegates/debug';
import { normalizeVec3, VEC3_ZERO, type Vec3Input } from '../core/vector';
import { deepMergeValues } from '../core/clone-utils';
import { buildLineGeometry, toFlatColors, toFlatPositions } from './line-geometry';
import type { CleanupContext } from '../core/base-node-life-cycle';

export interface LinePickResult {
	point: Vector3;
	pointOnLine: Vector3;
	faceIndex: number;
	distance: number;
}

export type ZylemLineOptions = GameEntityOptions & {
	/** Polyline vertices in world space (minimum 2). */
	points: Vec3Input[];
	/** Optional per-vertex colors (enables `vertexColors` on the material). */
	colors?: ColorRepresentation[];
	linewidth?: number;
	worldUnits?: boolean;
	alphaToCoverage?: boolean;
	opacity?: number;
	transparent?: boolean;
	dashed?: boolean;
	dashSize?: number;
	gapSize?: number;
	/** Default Raycaster threshold for {@link pickFromRaycaster}. */
	pickThreshold?: number;
};

const lineDefaults: ZylemLineOptions = {
	...commonDefaults,
	points: [
		{ x: 0, y: 0, z: 0 },
		{ x: 1, y: 0, z: 0 },
	],
	linewidth: 1,
	worldUnits: true,
	alphaToCoverage: false,
	opacity: 1,
	transparent: false,
	dashed: false,
	dashSize: 1,
	gapSize: 1,
	pickThreshold: 0,
};

export const LINE_TYPE = Symbol('Line');

function assertMinPoints(points: Vec3Input[] | undefined, context: string): Vec3Input[] {
	if (!points || points.length < 2) {
		throw new Error(`${context}: at least two points are required`);
	}
	return points;
}

function resolveLineColor(color: Color | ColorRepresentation | undefined): Color {
	return color instanceof Color ? color.clone() : new Color(color ?? '#ffffff');
}

function buildLineMaterial(options: ZylemLineOptions): Line2NodeMaterial {
	const vertexColors = Boolean(options.colors?.length);
	const material = new Line2NodeMaterial({
		color: resolveLineColor(options.color).getHex(),
		linewidth: options.linewidth ?? lineDefaults.linewidth,
		worldUnits: options.worldUnits ?? lineDefaults.worldUnits,
		vertexColors,
		dashed: options.dashed ?? false,
		dashSize: options.dashSize ?? lineDefaults.dashSize,
		gapSize: options.gapSize ?? lineDefaults.gapSize,
		transparent: options.transparent ?? false,
		opacity: options.opacity ?? 1,
	});

	material.alphaToCoverage = options.alphaToCoverage ?? false;
	return material;
}

function toPickResult(hit: Intersection): LinePickResult | null {
	if (!hit.point || !hit.pointOnLine || hit.faceIndex == null) {
		return null;
	}

	return {
		point: hit.point.clone(),
		pointOnLine: hit.pointOnLine.clone(),
		faceIndex: hit.faceIndex,
		distance: hit.distance,
	};
}

/**
 * Raycast against a {@link ZylemLine} using Three.js `Line2` picking rules.
 */
export function pickZylemLine(
	raycaster: Raycaster,
	line: ZylemLine,
	options: { threshold?: number } = {},
): LinePickResult | null {
	const lineObject = line.getLineObject();
	if (!lineObject) {
		return null;
	}

	const threshold = options.threshold ?? line.options.pickThreshold ?? 0;
	const line2Params = raycaster.params.Line2 ?? { threshold: 0 };
	line2Params.threshold = threshold;
	raycaster.params.Line2 = line2Params;

	const hits = raycaster.intersectObject(lineObject, false);
	const first = hits[0];
	return first ? toPickResult(first) : null;
}

export class ZylemLine extends GameEntity<ZylemLineOptions> {
	static type = LINE_TYPE;

	private _line: Line2 | null = null;
	private _geometry: InstanceType<typeof Line2>['geometry'] | null = null;
	private _material: Line2NodeMaterial | null = null;

	constructor(options?: Partial<ZylemLineOptions>) {
		super();
		const merged = deepMergeValues(lineDefaults, options) as ZylemLineOptions;
		merged.points = assertMinPoints(merged.points, 'ZylemLine').map((point) =>
			normalizeVec3(point, VEC3_ZERO),
		);
		this.options = merged;
	}

	public override create(): this {
		this.disposeLineResources();
		this.group = new Group();
		this.rebuildLine();
		this.applyGroupPosition();
		return super.create();
	}

	/** Replace the polyline vertices at runtime. */
	setPoints(points: Vec3Input[], colors?: ColorRepresentation[]): this {
		assertMinPoints(points, 'setPoints');
		this.options.points = points.map((point) => normalizeVec3(point, VEC3_ZERO));
		if (colors) {
			this.options.colors = colors;
		}

		if (!this._line || !this._geometry || !this._material) {
			return this;
		}

		this._geometry.setPositions(toFlatPositions(this.options.points));
		const flatColors = toFlatColors(
			this.options.colors,
			this.options.points.length,
			resolveLineColor(this.options.color),
		);
		if (flatColors) {
			this._geometry.setColors(flatColors);
		}

		this._material.vertexColors = Boolean(this.options.colors?.length);
		if (this.options.dashed) {
			this._line.computeLineDistances();
		}

		this._geometry.computeBoundingBox();
		this._geometry.computeBoundingSphere();
		return this;
	}

	getLineObject(): Line2 | null {
		return this._line;
	}

	pickFromRaycaster(
		raycaster: Raycaster,
		options: { threshold?: number } = {},
	): LinePickResult | null {
		return pickZylemLine(raycaster, this, options);
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();

		return {
			...baseInfo,
			type: String(ZylemLine.type),
			points: this.options.points.length,
			linewidth: this.options.linewidth ?? lineDefaults.linewidth,
			worldUnits: this.options.worldUnits ?? lineDefaults.worldUnits,
		};
	}

	private rebuildLine(): void {
		this._geometry = buildLineGeometry({
			points: this.options.points,
			colors: this.options.colors,
		});
		this._material = buildLineMaterial(this.options);
		this._line = new Line2(this._geometry, this._material);
		if (this.options.dashed) {
			this._line.computeLineDistances();
		}
		this.group?.add(this._line);
	}

	private applyGroupPosition(): void {
		if (!this.group) {
			return;
		}
		const position = normalizeVec3(this.options.position, VEC3_ZERO);
		this.group.position.set(position.x, position.y, position.z);
	}

	protected override _cleanup(_params: CleanupContext<this>): void {
		this.disposeLineResources();
		super._cleanup(_params);
	}

	private disposeLineResources(): void {
		this._line?.removeFromParent();
		this._geometry?.dispose();
		this._material?.dispose();
		this._line = null;
		this._geometry = null;
		this._material = null;
	}
}

type LineOptions = BaseNode | Partial<ZylemLineOptions>;

export function createLine(...args: Array<LineOptions>): ZylemLine {
	const options = mergeArgs(args, lineDefaults);
	assertMinPoints(options.points, 'createLine');
	const entity = new ZylemLine(options);
	return finalizeEntityCloneSupport(
		entity,
		(cloneOptions) => createLine(cloneOptions ?? {}),
	);
}
