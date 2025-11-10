import { AnimationClip, Object3D } from 'three';
import { GLTF } from 'three/addons/loaders/GLTFLoader.js';
export declare enum FileExtensionTypes {
    FBX = "fbx",
    GLTF = "gltf"
}
export interface AssetLoaderResult {
    object?: Object3D;
    animation?: AnimationClip;
    gltf?: GLTF;
}
export interface IAssetLoader {
    load(file: string): Promise<AssetLoaderResult>;
    isSupported(file: string): boolean;
}
export declare class FBXAssetLoader implements IAssetLoader {
    private loader;
    isSupported(file: string): boolean;
    load(file: string): Promise<AssetLoaderResult>;
}
export declare class GLTFAssetLoader implements IAssetLoader {
    private loader;
    isSupported(file: string): boolean;
    load(file: string): Promise<AssetLoaderResult>;
}
export declare class EntityAssetLoader {
    private loaders;
    loadFile(file: string): Promise<AssetLoaderResult>;
}
//# sourceMappingURL=entity-asset-loader.d.ts.map