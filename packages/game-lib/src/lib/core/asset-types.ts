/**
 * Asset type definitions for the Zylem Asset Manager
 */

import { AnimationClip, Texture, Material, Object3D } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Supported asset types
 */
export enum AssetType {
	TEXTURE = 'texture',
	MATERIAL = 'material',
	GLTF = 'gltf',
	FBX = 'fbx',
	OBJ = 'obj',
	STL = 'stl',
	PLY = 'ply',
	USD = 'usd',
	GAUSSIAN_SPLAT = 'gaussian-splat',
	SOG = 'sog',
	AUDIO = 'audio',
	FILE = 'file',
	JSON = 'json'
}

/**
 * Disambiguates extension-less URLs and files that share an extension.
 * `mesh` and `splat` override the `.ply` header sniff.
 * `sog` accepts a bundled `.sog` or an unbundled `meta.json`.
 */
export type ModelFileType = 'mesh' | 'splat' | 'sog';

/**
 * Options for loading assets
 */
export interface AssetLoadOptions {
	/** Force reload even if cached */
	forceReload?: boolean;
	/** Clone the cached asset instead of returning reference (for textures) */
	clone?: boolean;
	/** Progress callback for individual asset */
	onProgress?: (progress: number) => void;
	/** Override sniffing for `.ply`, extension-less URLs, and SOG JSON. */
	fileType?: ModelFileType;
	/** Explicit Wavefront material library. Sibling `mtllib` is used when omitted. */
	mtlPath?: string;
	/**
	 * STL and mesh PLY have no axis metadata. `'y'` trusts the file.
	 * `'z'` applies the same X-axis rotation FBX and USD use for Z-up files.
	 */
	upAxis?: 'y' | 'z';
	/**
	 * FBX only. Scale the root by `userData.unitScaleFactor`.
	 * Off by default so existing Mixamo scenes keep their authored size.
	 */
	applyUnitScale?: boolean;
	/**
	 * Gaussian captures. `'authored'` keeps the file axes.
	 * `'y-down'` rotates 180° about X for OpenCV-style captures.
	 */
	splatFrame?: 'authored' | 'y-down';
}

/**
 * Interface for loader adapters
 */
export interface LoaderAdapter<T> {
	load(url: string, options?: AssetLoadOptions): Promise<T>;
	isSupported(url: string): boolean;
}

/**
 * Result types for different asset loaders
 */
export interface TextureLoadResult {
	texture: Texture;
}

export interface ModelLoadResult {
	object: Object3D;
	animations?: AnimationClip[];
	gltf?: GLTF;
}

export interface AudioLoadResult {
	buffer: AudioBuffer;
}

export interface FileLoadResult {
	data: string | ArrayBuffer;
}

/**
 * Asset manager event types
 */
export type AssetManagerEvents = {
	'asset:loading': { url: string; type: AssetType };
	'asset:loaded': { url: string; type: AssetType; fromCache: boolean };
	'asset:error': { url: string; type: AssetType; error: Error };
	'batch:progress': { loaded: number; total: number };
	'batch:complete': { urls: string[] };
};

/**
 * Batch load request item
 */
export interface BatchLoadItem {
	url: string;
	type: AssetType;
	options?: AssetLoadOptions;
}

/**
 * Serialized geometry data for worker transfer
 */
export interface SerializedGeometry {
	positions: Float32Array;
	normals?: Float32Array;
	uvs?: Float32Array;
	indices?: Uint16Array | Uint32Array;
}

/**
 * Serialized mesh data for worker transfer
 */
export interface SerializedMesh {
	name: string;
	geometry: SerializedGeometry;
	materialIndex: number;
	position: [number, number, number];
	rotation: [number, number, number, number];
	scale: [number, number, number];
}

/**
 * Serialized material data for worker transfer
 */
export interface SerializedMaterial {
	type: string;
	color?: number;
	map?: string; // texture URL
	normalMap?: string;
	roughness?: number;
	metalness?: number;
}

/**
 * Serialized model data for worker transfer
 */
export interface SerializedModel {
	meshes: SerializedMesh[];
	materials: SerializedMaterial[];
	animations: any[];
}
