import {
	BoxGeometry,
	CapsuleGeometry,
	ConeGeometry,
	CylinderGeometry,
	Mesh,
	MeshStandardMaterial,
	SphereGeometry,
	type Color,
} from 'three';
import { MaterialBuilder, type MaterialOptions } from '../../graphics/material';
import type { Vec3 } from '../../core/vector';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Shared options that every mesh factory accepts. */
interface BaseMeshOptions {
	/** Offset position relative to the entity origin */
	position?: Vec3;
	/** Material options (texture, shader, etc.) */
	material?: Partial<MaterialOptions>;
	/** Convenience color override */
	color?: Color;
}

/**
 * Build a material array from options.
 * Returns a fallback MeshStandardMaterial when no material options are provided.
 */
function buildMaterial(
	opts: BaseMeshOptions,
	entityType: symbol = Symbol('mesh'),
): MeshStandardMaterial[] {
	if (opts.material || opts.color) {
		const builder = new MaterialBuilder();
		builder.build(
			{ ...opts.material, color: opts.color ?? opts.material?.color },
			entityType,
		);
		if (builder.materials.length > 0) {
			return builder.materials as MeshStandardMaterial[];
		}
	}
	return [new MeshStandardMaterial()];
}

function finalizeMesh(mesh: Mesh, opts: BaseMeshOptions): Mesh {
	if (opts.position) {
		mesh.position.set(opts.position.x, opts.position.y, opts.position.z);
	}
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	return mesh;
}

// ─────────────────────────────────────────────────────────────────────────────
// Box
// ─────────────────────────────────────────────────────────────────────────────

export interface BoxMeshOptions extends BaseMeshOptions {
	/** Box dimensions (default: 1x1x1) */
	size?: Vec3;
}

/**
 * Create a box mesh.
 */
export function boxMesh(opts: BoxMeshOptions = {}): Mesh {
	const size = opts.size ?? { x: 1, y: 1, z: 1 };
	const geometry = new BoxGeometry(size.x, size.y, size.z);
	const materials = buildMaterial(opts);
	return finalizeMesh(new Mesh(geometry, materials.at(-1)), opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sphere
// ─────────────────────────────────────────────────────────────────────────────

export interface SphereMeshOptions extends BaseMeshOptions {
	/** Sphere radius (default: 1) */
	radius?: number;
}

/**
 * Create a sphere mesh.
 */
export function sphereMesh(opts: SphereMeshOptions = {}): Mesh {
	const geometry = new SphereGeometry(opts.radius ?? 1);
	const materials = buildMaterial(opts);
	return finalizeMesh(new Mesh(geometry, materials.at(-1)), opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cone
// ─────────────────────────────────────────────────────────────────────────────

export interface ConeMeshOptions extends BaseMeshOptions {
	/** Base radius (default: 1) */
	radius?: number;
	/** Height (default: 2) */
	height?: number;
	/** Radial segments (default: 32) */
	radialSegments?: number;
}

/**
 * Create a cone mesh.
 */
export function coneMesh(opts: ConeMeshOptions = {}): Mesh {
	const geometry = new ConeGeometry(
		opts.radius ?? 1,
		opts.height ?? 2,
		opts.radialSegments ?? 32,
	);
	const materials = buildMaterial(opts);
	return finalizeMesh(new Mesh(geometry, materials.at(-1)), opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pyramid (cone geometry with 4 segments)
// ─────────────────────────────────────────────────────────────────────────────

export interface PyramidMeshOptions extends BaseMeshOptions {
	/** Base radius (default: 1) */
	radius?: number;
	/** Height (default: 2) */
	height?: number;
}

/**
 * Create a pyramid mesh (4-sided cone).
 */
export function pyramidMesh(opts: PyramidMeshOptions = {}): Mesh {
	const geometry = new ConeGeometry(opts.radius ?? 1, opts.height ?? 2, 4);
	const materials = buildMaterial(opts);
	return finalizeMesh(new Mesh(geometry, materials.at(-1)), opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cylinder
// ─────────────────────────────────────────────────────────────────────────────

export interface CylinderMeshOptions extends BaseMeshOptions {
	/** Top radius (default: 1) */
	radiusTop?: number;
	/** Bottom radius (default: 1) */
	radiusBottom?: number;
	/** Height (default: 2) */
	height?: number;
	/** Radial segments (default: 32) */
	radialSegments?: number;
}

/**
 * Create a cylinder mesh.
 */
export function cylinderMesh(opts: CylinderMeshOptions = {}): Mesh {
	const geometry = new CylinderGeometry(
		opts.radiusTop ?? 1,
		opts.radiusBottom ?? 1,
		opts.height ?? 2,
		opts.radialSegments ?? 32,
	);
	const materials = buildMaterial(opts);
	return finalizeMesh(new Mesh(geometry, materials.at(-1)), opts);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pill (capsule)
// ─────────────────────────────────────────────────────────────────────────────

export interface PillMeshOptions extends BaseMeshOptions {
	/** Capsule hemisphere radius (default: 0.5) */
	radius?: number;
	/** Cylindrical section length (default: 1) */
	length?: number;
	/** Cap segments (default: 10) */
	capSegments?: number;
	/** Radial segments (default: 20) */
	radialSegments?: number;
}

/**
 * Create a pill (capsule) mesh.
 */
export function pillMesh(opts: PillMeshOptions = {}): Mesh {
	const geometry = new CapsuleGeometry(
		opts.radius ?? 0.5,
		opts.length ?? 1,
		opts.capSegments ?? 10,
		opts.radialSegments ?? 20,
	);
	const materials = buildMaterial(opts);
	return finalizeMesh(new Mesh(geometry, materials.at(-1)), opts);
}
