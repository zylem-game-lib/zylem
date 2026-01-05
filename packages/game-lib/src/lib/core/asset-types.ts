/**
 * Asset type definitions for the Zylem Asset Manager
 */

import { Texture, Material, Object3D } from 'three';
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
	AUDIO = 'audio',
	FILE = 'file',
	JSON = 'json'
}

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
	animations?: any[];
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
