import { AnimationClip, Object3D } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
export interface AssetLoaderResult {
    object?: Object3D;
    animation?: AnimationClip;
    gltf?: GLTF;
}
export interface IAssetLoader {
    load(file: string): Promise<AssetLoaderResult>;
    isSupported(file: string): boolean;
}
export declare class EntityAssetLoader {
    private loaders;
    loadFile(file: string): Promise<AssetLoaderResult>;
}
//# sourceMappingURL=entity-asset-loader.d.ts.map