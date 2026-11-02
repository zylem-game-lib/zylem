/**
 * Centralized Asset Manager for Zylem
 *
 * Provides caching, parallel loading, and unified access to all asset types.
 * All asset loading should funnel through this manager.
 */

import { Texture, LoadingManager, Cache } from 'three';
import mitt, { Emitter } from 'mitt';

import {
  AssetType,
  AssetLoadOptions,
  AssetManagerEvents,
  BatchLoadItem,
  ModelLoadResult,
} from './asset-types';

import { TextureLoaderAdapter, type TextureOptions } from './loaders/texture-loader';
import { GLTFLoaderAdapter, type GLTFLoadOptions, type GLTFRuntimeConfig } from './loaders/gltf-loader';
import { AudioLoaderAdapter } from './loaders/audio-loader';
import { FileLoaderAdapter, JsonLoaderAdapter, type FileLoadOptions } from './loaders/file-loader';
import type { FBXLoadOptions } from './loaders/fbx-loader';
import type { OBJLoadOptions } from './loaders/obj-loader';
import type { FBXLoaderAdapter } from './loaders/fbx-loader';
import type { OBJLoaderAdapter } from './loaders/obj-loader';
import type { GeometryMeshAdapter } from './loaders/geometry-mesh-loader';
import type { GaussianSplatAdapter } from './loaders/gaussian-splat-loader';
import type { USDLoaderAdapter } from './loaders/usd-loader';
import type { SogLoaderAdapter } from './loaders/sog-loader';
import { VEC2_ONE, toThreeVector2 } from './vector';
import { fetchArrayBuffer } from './loaders/fetch-buffer';
import { ALEMBIC_UNSUPPORTED_MESSAGE, classifyPly, type PlyKind } from './loaders/model-sniff';
import { getUrlFileExtension, getUrlFileName } from './loaders/url-utils';

function optionCacheSuffix(options?: AssetLoadOptions): string {
  const parts: string[] = [];
  if (options?.upAxis === 'z') parts.push('up-z');
  if (options?.applyUnitScale) parts.push('unit-scale');
  if (options?.splatFrame === 'y-down') parts.push('y-down');
  return parts.length ? `:${parts.join('+')}` : '';
}

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
  private pendingGLTFRuntimePath: string | null = null;
  private pendingGLTFRuntimePromise: Promise<void> | null = null;
  private pendingGLTFRuntimeResolve: (() => void) | null = null;

  // Loaders. GLTF stays eager because stage startup configures it.
  // The other model adapters are created on first use so their three.js
  // parsers stay out of the first chunk.
  private textureLoader: TextureLoaderAdapter;
  private gltfLoader: GLTFLoaderAdapter;
  private fbxLoaderPromise: Promise<FBXLoaderAdapter> | null = null;
  private objLoaderPromise: Promise<OBJLoaderAdapter> | null = null;
  private geometryLoaderPromise: Promise<GeometryMeshAdapter> | null = null;
  private gaussianLoaderPromise: Promise<GaussianSplatAdapter> | null = null;
  private usdLoaderPromise: Promise<USDLoaderAdapter> | null = null;
  private sogLoaderPromise: Promise<SogLoaderAdapter> | null = null;
  private audioLoader: AudioLoaderAdapter;
  private fileLoader: FileLoaderAdapter;
  private jsonLoader: JsonLoaderAdapter;
  private bufferLoads = new Map<string, Promise<ArrayBuffer>>();

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
    cacheMisses: 0,
  };

  private constructor() {
    // Initialize loaders
    this.textureLoader = new TextureLoaderAdapter();
    this.gltfLoader = new GLTFLoaderAdapter();
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
      texture => {
        if (!options?.clone) return texture;
        const cloned = this.textureLoader.clone(texture);
        // Re-apply per-instance texture options to the clone so that
        // different callers sharing the same cached base texture can
        // use independent repeat / wrap values.
        if (options.repeat) {
          cloned.repeat.copy(toThreeVector2(options.repeat, VEC2_ONE));
        }
        if (options.wrapS !== undefined) {
          cloned.wrapS = options.wrapS;
        }
        if (options.wrapT !== undefined) {
          cloned.wrapT = options.wrapT;
        }
        return cloned;
      },
    );
  }

  // ==================== MODEL LOADING ====================

  /**
   * Load a GLTF/GLB model with caching
   */
  async loadGLTF(
    url: string,
    options?: GLTFLoadOptions,
  ): Promise<ModelLoadResult> {
    await this.waitForPreparedGLTFRuntime();
    return this.loadWithCache(
      url,
      AssetType.GLTF,
      this.modelCache,
      () => this.gltfLoader.load(url, options),
      options,
      result => (options?.clone ? this.gltfLoader.clone(result) : result),
    );
  }

  /**
   * Prime GLTF runtime requirements before a renderer is available.
   * This lets eager actor/model loads pause until stage startup configures
   * the renderer-backed KTX2 runtime.
   */
  prepareGLTFRuntime(options?: GLTFRuntimeConfig): void {
    const pendingPath = this.normalizeTranscoderPath(options?.ktx2TranscoderPath);
    if (!pendingPath) {
      return;
    }

    if (this.pendingGLTFRuntimePath === pendingPath && this.pendingGLTFRuntimePromise) {
      return;
    }

    this.pendingGLTFRuntimePath = pendingPath;
    if (!this.pendingGLTFRuntimePromise) {
      this.pendingGLTFRuntimePromise = new Promise<void>((resolve) => {
        this.pendingGLTFRuntimeResolve = resolve;
      });
    }
  }

  /**
   * Configure shared GLTF runtime support such as Meshopt and KTX2 loaders.
   */
  async configureGLTFRuntime(options?: GLTFRuntimeConfig): Promise<void> {
    await this.gltfLoader.configureRuntime(options);
    const configuredPath = this.normalizeTranscoderPath(options?.ktx2TranscoderPath);
    if (configuredPath && options?.renderer) {
      this.resolvePreparedGLTFRuntime(configuredPath);
    }
  }

  /**
   * Load an FBX model with caching
   */
  async loadFBX(
    url: string,
    options?: FBXLoadOptions,
  ): Promise<ModelLoadResult> {
    const loader = await this.fbxLoader();
    return this.loadWithCache(
      `${url}${optionCacheSuffix(options)}`,
      AssetType.FBX,
      this.modelCache,
      () => loader.load(url, options),
      options,
      result => (options?.clone ? loader.clone(result) : result),
    );
  }

  /**
   * Load an OBJ model with caching.
   * An explicit MTL path is part of the cache key. A sibling `mtllib`
   * is resolved inside the adapter and is identified by the OBJ URL.
   */
  async loadOBJ(
    url: string,
    options?: OBJLoadOptions,
  ): Promise<ModelLoadResult> {
    const loader = await this.objLoader();
    const cacheKey = options?.mtlPath ? `${url}:${options.mtlPath}` : url;
    return this.loadWithCache(
      cacheKey,
      AssetType.OBJ,
      this.modelCache,
      () => loader.load(url, options),
      options,
      result => (options?.clone ? loader.clone(result) : result),
    );
  }

  /**
   * Load an STL triangle soup.
   */
  async loadSTL(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const loader = await this.geometryLoader();
    return this.loadWithCache(
      `${url}${optionCacheSuffix(options)}`,
      AssetType.STL,
      this.modelCache,
      () => loader.load(url, options),
      options,
      result => (options?.clone ? loader.clone(result) : result),
    );
  }

  /**
   * Load a PLY file. Mesh and Gaussian payloads do not share a cache entry.
   */
  async loadPLY(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const hinted = options?.fileType === 'mesh' || options?.fileType === 'splat'
      ? options.fileType
      : null;
    const suffix = optionCacheSuffix(options);
    if (!hinted && !options?.forceReload) {
      if (this.modelCache.has(`${url}:mesh${suffix}`)) {
        return this.loadCachedPly(url, 'mesh', options);
      }
      if (this.modelCache.has(`${url}:splat${suffix}`)) {
        return this.loadCachedPly(url, 'splat', options);
      }
    }

    const buffer = await this.loadBuffer(url, options);
    const kind = classifyPly(buffer, hinted);
    return this.loadParsedPly(url, kind, buffer, options);
  }

  /**
   * Load a USD, USDA, USDC, or USDZ file through `USDLoader`.
   */
  async loadUSD(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const loader = await this.usdLoader();
    return this.loadWithCache(
      url,
      AssetType.USD,
      this.modelCache,
      () => loader.load(url, options),
      options,
      result => (options?.clone ? loader.clone(result) : result),
    );
  }

  /**
   * Load an SPZ, SPLAT, or KSPLAT Gaussian capture.
   */
  async loadGaussianSplat(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const loader = await this.gaussianLoader();
    return this.loadWithCache(
      `${url}${optionCacheSuffix(options)}`,
      AssetType.GAUSSIAN_SPLAT,
      this.modelCache,
      () => loader.load(url, options),
      options,
      result => (options?.clone ? loader.clone(result) : result),
    );
  }

  /**
   * Load a bundled `.sog`, or an unbundled `meta.json` requested as a model.
   */
  async loadSOG(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const loader = await this.sogLoader();
    return this.loadWithCache(
      url,
      AssetType.SOG,
      this.modelCache,
      () => loader.load(url, options),
      options,
      result => (options?.clone ? loader.clone(result) : result),
    );
  }

  /**
   * Auto-detect model type and load
   */
  async loadModel(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const extension = getUrlFileExtension(url);
    if (extension === 'abc') {
      throw new Error(ALEMBIC_UNSUPPORTED_MESSAGE);
    }
    if (this.isSogRequest(url, options)) {
      return this.loadSOG(url, options);
    }
    if (extension === 'ply' || (!extension && (options?.fileType === 'mesh' || options?.fileType === 'splat'))) {
      return this.loadPLY(url, options);
    }

    switch (extension) {
      case 'gltf':
      case 'glb':
        return this.loadGLTF(url, options);
      case 'fbx':
        return this.loadFBX(url, options);
      case 'obj':
        return this.loadOBJ(url, options);
      case 'stl':
        return this.loadSTL(url, options);
      case 'usd':
      case 'usda':
      case 'usdc':
      case 'usdz':
        return this.loadUSD(url, options);
      case 'spz':
      case 'splat':
      case 'ksplat':
        return this.loadGaussianSplat(url, options);
      default:
        throw new Error(`Unsupported model format: ${extension}`);
    }
  }

  // ==================== AUDIO LOADING ====================

  /**
   * Load an audio buffer with caching
   */
  async loadAudio(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<AudioBuffer> {
    return this.loadWithCache(
      url,
      AssetType.AUDIO,
      this.audioCache,
      () => this.audioLoader.load(url, options),
      options,
    );
  }

  // ==================== FILE LOADING ====================

  /**
   * Load a raw file with caching
   */
  async loadFile(
    url: string,
    options?: FileLoadOptions,
  ): Promise<string | ArrayBuffer> {
    const cacheKey = options?.responseType
      ? `${url}:${options.responseType}`
      : url;
    return this.loadWithCache(
      cacheKey,
      AssetType.FILE,
      this.fileCache,
      () => this.fileLoader.load(url, options),
      options,
    );
  }

  /**
   * Load a JSON file with caching
   */
  async loadJSON<T = unknown>(
    url: string,
    options?: AssetLoadOptions,
  ): Promise<T> {
    return this.loadWithCache(
      url,
      AssetType.JSON,
      this.jsonCache,
      () => this.jsonLoader.load<T>(url, options),
      options,
    ) as Promise<T>;
  }

  // ==================== BATCH LOADING ====================

  /**
   * Load multiple assets in parallel
   */
  async loadBatch(items: BatchLoadItem[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();

    const promises = items.map(async item => {
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
          case AssetType.STL:
            result = await this.loadSTL(item.url, item.options);
            break;
          case AssetType.PLY:
            result = await this.loadPLY(item.url, item.options);
            break;
          case AssetType.USD:
            result = await this.loadUSD(item.url, item.options);
            break;
          case AssetType.GAUSSIAN_SPLAT:
            result = await this.loadGaussianSplat(item.url, item.options);
            break;
          case AssetType.SOG:
            result = await this.loadSOG(item.url, item.options);
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
          error: error as Error,
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
    return (
      this.cacheHasUrl(this.textureCache, url) ||
      this.cacheHasUrl(this.modelCache, url) ||
      this.cacheHasUrl(this.audioCache, url) ||
      this.cacheHasUrl(this.fileCache, url) ||
      this.cacheHasUrl(this.jsonCache, url)
    );
  }

  /**
   * Clear all caches or a specific URL.
   * Cached textures are disposed, and ImageBitmap sources are closed.
   */
  clearCache(url?: string): void {
    if (url) {
      this.deleteCacheUrl(this.textureCache, url, (entry) => this.disposeCachedTexture(entry.result));
      this.deleteCacheUrl(this.modelCache, url);
      this.deleteCacheUrl(this.audioCache, url);
      this.deleteCacheUrl(this.fileCache, url);
      this.deleteCacheUrl(this.jsonCache, url);
      this.bufferLoads.delete(url);
      return;
    }

    for (const entry of this.textureCache.values()) {
      this.disposeCachedTexture(entry.result);
    }
    this.textureCache.clear();
    this.modelCache.clear();
    this.audioCache.clear();
    this.fileCache.clear();
    this.jsonCache.clear();
    this.bufferLoads.clear();
    Cache.clear();
    this.pendingGLTFRuntimePath = null;
    this.pendingGLTFRuntimePromise = null;
    this.pendingGLTFRuntimeResolve = null;
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
    handler: (payload: AssetManagerEvents[K]) => void,
  ): void {
    this.events.on(event, handler);
  }

  /**
   * Unsubscribe from asset manager events
   */
  off<K extends keyof AssetManagerEvents>(
    event: K,
    handler: (payload: AssetManagerEvents[K]) => void,
  ): void {
    this.events.off(event, handler);
  }

  // ==================== PRIVATE HELPERS ====================

  private fbxLoader(): Promise<FBXLoaderAdapter> {
    this.fbxLoaderPromise ??= import('./loaders/fbx-loader').then(
      (module) => new module.FBXLoaderAdapter(),
    );
    return this.fbxLoaderPromise;
  }

  private objLoader(): Promise<OBJLoaderAdapter> {
    this.objLoaderPromise ??= import('./loaders/obj-loader').then(
      (module) => new module.OBJLoaderAdapter(),
    );
    return this.objLoaderPromise;
  }

  private geometryLoader(): Promise<GeometryMeshAdapter> {
    this.geometryLoaderPromise ??= import('./loaders/geometry-mesh-loader').then(
      (module) => new module.GeometryMeshAdapter(),
    );
    return this.geometryLoaderPromise;
  }

  private gaussianLoader(): Promise<GaussianSplatAdapter> {
    this.gaussianLoaderPromise ??= import('./loaders/gaussian-splat-loader').then(
      (module) => new module.GaussianSplatAdapter(),
    );
    return this.gaussianLoaderPromise;
  }

  private usdLoader(): Promise<USDLoaderAdapter> {
    this.usdLoaderPromise ??= import('./loaders/usd-loader').then(
      (module) => new module.USDLoaderAdapter(),
    );
    return this.usdLoaderPromise;
  }

  private sogLoader(): Promise<SogLoaderAdapter> {
    this.sogLoaderPromise ??= import('./loaders/sog-loader').then(
      (module) => new module.SogLoaderAdapter(),
    );
    return this.sogLoaderPromise;
  }

  private isSogRequest(url: string, options?: AssetLoadOptions): boolean {
    if (getUrlFileName(url) === 'lod-meta.json') {
      return options?.fileType === 'sog';
    }
    return options?.fileType === 'sog'
      || getUrlFileExtension(url) === 'sog'
      || getUrlFileName(url) === 'meta.json';
  }

  private loadBuffer(url: string, options?: AssetLoadOptions): Promise<ArrayBuffer> {
    if (options?.forceReload) {
      this.bufferLoads.delete(url);
    }
    const existing = this.bufferLoads.get(url);
    if (existing) {
      return existing;
    }
    const pending = fetchArrayBuffer(url, options).finally(() => {
      this.bufferLoads.delete(url);
    });
    this.bufferLoads.set(url, pending);
    return pending;
  }

  private loadCachedPly(
    url: string,
    kind: PlyKind,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    return this.loadParsedPly(url, kind, null, options);
  }

  private async loadParsedPly(
    url: string,
    kind: PlyKind,
    buffer: ArrayBuffer | null,
    options?: AssetLoadOptions,
  ): Promise<ModelLoadResult> {
    const cacheKey = `${url}:${kind}${optionCacheSuffix(options)}`;
    if (kind === 'splat') {
      const loader = await this.gaussianLoader();
      return this.loadWithCache(
        cacheKey,
        AssetType.GAUSSIAN_SPLAT,
        this.modelCache,
        async () => {
          const bytes = buffer ?? await this.loadBuffer(url, options);
          return loader.parse('ply', bytes, options);
        },
        options,
        (result) => (options?.clone ? loader.clone(result) : result),
      );
    }

    const loader = await this.geometryLoader();
    const geometryModule = await import('./loaders/geometry-mesh-loader');
    return this.loadWithCache(
      cacheKey,
      AssetType.PLY,
      this.modelCache,
      async () => {
        const bytes = buffer ?? await this.loadBuffer(url, options);
        return geometryModule.parseMeshPlyBuffer(bytes, options);
      },
      options,
      (result) => (options?.clone ? loader.clone(result) : result),
    );
  }

  private cacheHasUrl(cache: Map<string, unknown>, url: string): boolean {
    if (cache.has(url)) {
      return true;
    }
    const prefix = `${url}:`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  private deleteCacheUrl<T>(
    cache: Map<string, CacheEntry<T>>,
    url: string,
    dispose?: (entry: CacheEntry<T>) => void,
  ): void {
    for (const key of [...cache.keys()]) {
      if (key === url || key.startsWith(`${url}:`)) {
        const entry = cache.get(key);
        if (entry && dispose) {
          dispose(entry);
        }
        cache.delete(key);
      }
    }
  }

  private disposeCachedTexture(texture: Texture | undefined): void {
    if (!texture) {
      return;
    }
    const image = texture.image as { close?: () => void } | undefined;
    image?.close?.();
    const sourceData = (texture as Texture & { source?: { data?: { close?: () => void } } }).source?.data;
    if (sourceData && sourceData !== image) {
      sourceData.close?.();
    }
    texture.dispose();
  }

  /**
   * Generic cache wrapper for loading assets
   */
  private async loadWithCache<T>(
    url: string,
    type: AssetType,
    cache: Map<string, CacheEntry<T>>,
    loader: () => Promise<T>,
    options?: AssetLoadOptions,
    cloner?: (result: T) => T,
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
      loadedAt: Date.now(),
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
      case AssetType.STL:
      case AssetType.PLY:
      case AssetType.USD:
      case AssetType.GAUSSIAN_SPLAT:
      case AssetType.SOG:
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

  private async waitForPreparedGLTFRuntime(): Promise<void> {
    if (!this.pendingGLTFRuntimePromise) {
      return;
    }

    await this.pendingGLTFRuntimePromise;
  }

  private resolvePreparedGLTFRuntime(configuredPath: string): void {
    if (this.pendingGLTFRuntimePath && this.pendingGLTFRuntimePath !== configuredPath) {
      return;
    }

    this.pendingGLTFRuntimeResolve?.();
    this.pendingGLTFRuntimeResolve = null;
    this.pendingGLTFRuntimePromise = null;
    this.pendingGLTFRuntimePath = null;
  }

  private normalizeTranscoderPath(path?: URL | string): string | null {
    if (!path) {
      return null;
    }

    const value = String(path);
    return value.endsWith('/') ? value : `${value}/`;
  }
}

/**
 * Singleton instance export for convenience
 */
export const assetManager = AssetManager.getInstance();
