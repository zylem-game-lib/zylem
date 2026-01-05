/**
 * Centralized Asset Manager for Zylem
 * 
 * Provides caching, parallel loading, and unified access to all asset types.
 * All asset loading should funnel through this manager.
 */

import { Texture, Object3D, LoadingManager, Cache } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { spawn, move } from 'multithreading';
import mitt, { Emitter } from 'mitt';

import {
	AssetType,
	AssetLoadOptions,
	AssetManagerEvents,
	BatchLoadItem,
	ModelLoadResult
} from './asset-types';

import {
	TextureLoaderAdapter,
	GLTFLoaderAdapter,
	FBXLoaderAdapter,
	OBJLoaderAdapter,
	AudioLoaderAdapter,
	FileLoaderAdapter,
	JsonLoaderAdapter,
	TextureOptions,
	GLTFLoadOptions,
	FBXLoadOptions,
	OBJLoadOptions,
	FileLoadOptions
} from './loaders';

/**
 * Asset cache entry
 */
interface CacheEntry<T> {
	promise: Promise<T>;
	result?: T;
	loadedAt: number;
}

/**
 * AssetManager - Singleton for all asset loading
 * 
 * Features:
 * - URL-based caching with deduplication
 * - Typed load methods for each asset type
 * - Batch loading with Promise.all() for parallelism
 * - Progress events via LoadingManager
 * - Clone support for shared assets (textures, models)
 */
export class AssetManager {
	private static instance: AssetManager | null = null;

	// Caches for different asset types
	private textureCache: Map<string, CacheEntry<Texture>> = new Map();
	private modelCache: Map<string, CacheEntry<ModelLoadResult>> = new Map();
	private audioCache: Map<string, CacheEntry<AudioBuffer>> = new Map();
	private fileCache: Map<string, CacheEntry<string | ArrayBuffer>> = new Map();
	private jsonCache: Map<string, CacheEntry<unknown>> = new Map();

	// Loaders
	private textureLoader: TextureLoaderAdapter;
	private gltfLoader: GLTFLoaderAdapter;
	private fbxLoader: FBXLoaderAdapter;
	private objLoader: OBJLoaderAdapter;
	private audioLoader: AudioLoaderAdapter;
	private fileLoader: FileLoaderAdapter;
	private jsonLoader: JsonLoaderAdapter;

	// Loading manager for progress tracking
	private loadingManager: LoadingManager;

	// Event emitter
	private events: Emitter<AssetManagerEvents>;

	// Stats
	private stats = {
		texturesLoaded: 0,
		modelsLoaded: 0,
		audioLoaded: 0,
		filesLoaded: 0,
		cacheHits: 0,
		cacheMisses: 0
	};

	private constructor() {
		// Initialize loaders
		this.textureLoader = new TextureLoaderAdapter();
		this.gltfLoader = new GLTFLoaderAdapter();
		this.fbxLoader = new FBXLoaderAdapter();
		this.objLoader = new OBJLoaderAdapter();
		this.audioLoader = new AudioLoaderAdapter();
		this.fileLoader = new FileLoaderAdapter();
		this.jsonLoader = new JsonLoaderAdapter();

		// Initialize loading manager
		this.loadingManager = new LoadingManager();
		this.loadingManager.onProgress = (url, loaded, total) => {
			this.events.emit('batch:progress', { loaded, total });
		};

		// Initialize event emitter
		this.events = mitt<AssetManagerEvents>();

		// Enable Three.js built-in cache
		Cache.enabled = true;
	}

	/**
	 * Get the singleton instance
	 */
	static getInstance(): AssetManager {
		if (!AssetManager.instance) {
			AssetManager.instance = new AssetManager();
		}
		return AssetManager.instance;
	}

	/**
	 * Reset the singleton (useful for testing)
	 */
	static resetInstance(): void {
		if (AssetManager.instance) {
			AssetManager.instance.clearCache();
			AssetManager.instance = null;
		}
	}

	// ==================== TEXTURE LOADING ====================

	/**
	 * Load a texture with caching
	 */
	async loadTexture(url: string, options?: TextureOptions): Promise<Texture> {
		return this.loadWithCache(
			url,
			AssetType.TEXTURE,
			this.textureCache,
			() => this.textureLoader.load(url, options),
			options,
			(texture) => options?.clone ? this.textureLoader.clone(texture) : texture
		);
	}

	// ==================== MODEL LOADING ====================

	/**
	 * Load a GLTF/GLB model with caching
	 */
	async loadGLTF(url: string, options?: GLTFLoadOptions): Promise<ModelLoadResult> {
		return this.loadWithCache(
			url,
			AssetType.GLTF,
			this.modelCache,
			() => this.gltfLoader.load(url, options),
			options,
			(result) => options?.clone ? this.gltfLoader.clone(result) : result
		);
	}

	/**
	 * Load an FBX model with caching
	 */
	async loadFBX(url: string, options?: FBXLoadOptions): Promise<ModelLoadResult> {
		return this.loadWithCache(
			url,
			AssetType.FBX,
			this.modelCache,
			() => this.fbxLoader.load(url, options),
			options,
			(result) => options?.clone ? this.fbxLoader.clone(result) : result
		);
	}

	/**
	 * Load an OBJ model with caching
	 */
	async loadOBJ(url: string, options?: OBJLoadOptions): Promise<ModelLoadResult> {
		// Include mtlPath in cache key for OBJ files
		const cacheKey = options?.mtlPath ? `${url}:${options.mtlPath}` : url;
		return this.loadWithCache(
			cacheKey,
			AssetType.OBJ,
			this.modelCache,
			() => this.objLoader.load(url, options),
			options,
			(result) => options?.clone ? this.objLoader.clone(result) : result
		);
	}

	/**
	 * Auto-detect model type and load
	 */
	async loadModel(url: string, options?: AssetLoadOptions): Promise<ModelLoadResult> {
		const ext = url.split('.').pop()?.toLowerCase();
		
		switch (ext) {
			case 'gltf':
			case 'glb':
				return this.loadGLTF(url, options);
			case 'fbx':
				return this.loadFBX(url, options);
			case 'obj':
				return this.loadOBJ(url, options);
			default:
				throw new Error(`Unsupported model format: ${ext}`);
		}
	}

	// ==================== AUDIO LOADING ====================

	/**
	 * Load an audio buffer with caching
	 */
	async loadAudio(url: string, options?: AssetLoadOptions): Promise<AudioBuffer> {
		return this.loadWithCache(
			url,
			AssetType.AUDIO,
			this.audioCache,
			() => this.audioLoader.load(url, options),
			options
		);
	}

	// ==================== FILE LOADING ====================

	/**
	 * Load a raw file with caching
	 */
	async loadFile(url: string, options?: FileLoadOptions): Promise<string | ArrayBuffer> {
		const cacheKey = options?.responseType ? `${url}:${options.responseType}` : url;
		return this.loadWithCache(
			cacheKey,
			AssetType.FILE,
			this.fileCache,
			() => this.fileLoader.load(url, options),
			options
		);
	}

	/**
	 * Load a JSON file with caching
	 */
	async loadJSON<T = unknown>(url: string, options?: AssetLoadOptions): Promise<T> {
		return this.loadWithCache(
			url,
			AssetType.JSON,
			this.jsonCache,
			() => this.jsonLoader.load<T>(url, options),
			options
		) as Promise<T>;
	}

	// ==================== BATCH LOADING ====================

	/**
	 * Load multiple assets in parallel
	 */
	async loadBatch(items: BatchLoadItem[]): Promise<Map<string, any>> {
		const results = new Map<string, any>();
		
		const promises = items.map(async (item) => {
			try {
				let result: any;
				
				switch (item.type) {
					case AssetType.TEXTURE:
						result = await this.loadTexture(item.url, item.options);
						break;
					case AssetType.GLTF:
						result = await this.loadGLTF(item.url, item.options);
						break;
					case AssetType.FBX:
						result = await this.loadFBX(item.url, item.options);
						break;
					case AssetType.OBJ:
						result = await this.loadOBJ(item.url, item.options);
						break;
					case AssetType.AUDIO:
						result = await this.loadAudio(item.url, item.options);
						break;
					case AssetType.FILE:
						result = await this.loadFile(item.url, item.options);
						break;
					case AssetType.JSON:
						result = await this.loadJSON(item.url, item.options);
						break;
					default:
						throw new Error(`Unknown asset type: ${item.type}`);
				}
				
				results.set(item.url, result);
			} catch (error) {
				this.events.emit('asset:error', {
					url: item.url,
					type: item.type,
					error: error as Error
				});
				throw error;
			}
		});

		await Promise.all(promises);
		
		this.events.emit('batch:complete', { urls: items.map(i => i.url) });
		
		return results;
	}

	/**
	 * Preload assets without returning results
	 */
	async preload(items: BatchLoadItem[]): Promise<void> {
		await this.loadBatch(items);
	}

	// ==================== CACHE MANAGEMENT ====================

	/**
	 * Check if an asset is cached
	 */
	isCached(url: string): boolean {
		return this.textureCache.has(url) ||
			this.modelCache.has(url) ||
			this.audioCache.has(url) ||
			this.fileCache.has(url) ||
			this.jsonCache.has(url);
	}

	/**
	 * Clear all caches or a specific URL
	 */
	clearCache(url?: string): void {
		if (url) {
			this.textureCache.delete(url);
			this.modelCache.delete(url);
			this.audioCache.delete(url);
			this.fileCache.delete(url);
			this.jsonCache.delete(url);
		} else {
			this.textureCache.clear();
			this.modelCache.clear();
			this.audioCache.clear();
			this.fileCache.clear();
			this.jsonCache.clear();
			Cache.clear();
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats(): typeof this.stats {
		return { ...this.stats };
	}

	// ==================== EVENTS ====================

	/**
	 * Subscribe to asset manager events
	 */
	on<K extends keyof AssetManagerEvents>(
		event: K,
		handler: (payload: AssetManagerEvents[K]) => void
	): void {
		this.events.on(event, handler);
	}

	/**
	 * Unsubscribe from asset manager events
	 */
	off<K extends keyof AssetManagerEvents>(
		event: K,
		handler: (payload: AssetManagerEvents[K]) => void
	): void {
		this.events.off(event, handler);
	}

	// ==================== PRIVATE HELPERS ====================

	/**
	 * Generic cache wrapper for loading assets
	 */
	private async loadWithCache<T>(
		url: string,
		type: AssetType,
		cache: Map<string, CacheEntry<T>>,
		loader: () => Promise<T>,
		options?: AssetLoadOptions,
		cloner?: (result: T) => T
	): Promise<T> {
		// Check for force reload
		if (options?.forceReload) {
			cache.delete(url);
		}

		// Check cache
		const cached = cache.get(url);
		if (cached) {
			this.stats.cacheHits++;
			this.events.emit('asset:loaded', { url, type, fromCache: true });
			
			const result = await cached.promise;
			return cloner ? cloner(result) : result;
		}

		// Cache miss - start loading
		this.stats.cacheMisses++;
		this.events.emit('asset:loading', { url, type });

		const promise = loader();
		const entry: CacheEntry<T> = {
			promise,
			loadedAt: Date.now()
		};
		cache.set(url, entry);

		try {
			const result = await promise;
			entry.result = result;
			
			// Update stats
			this.updateStats(type);
			
			this.events.emit('asset:loaded', { url, type, fromCache: false });
			
			return cloner ? cloner(result) : result;
		} catch (error) {
			// Remove failed entry from cache
			cache.delete(url);
			this.events.emit('asset:error', { url, type, error: error as Error });
			throw error;
		}
	}

	private updateStats(type: AssetType): void {
		switch (type) {
			case AssetType.TEXTURE:
				this.stats.texturesLoaded++;
				break;
			case AssetType.GLTF:
			case AssetType.FBX:
			case AssetType.OBJ:
				this.stats.modelsLoaded++;
				break;
			case AssetType.AUDIO:
				this.stats.audioLoaded++;
				break;
			case AssetType.FILE:
			case AssetType.JSON:
				this.stats.filesLoaded++;
				break;
		}
	}
}

/**
 * Singleton instance export for convenience
 */
export const assetManager = AssetManager.getInstance();