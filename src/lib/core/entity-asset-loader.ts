import { AnimationClip, Object3D } from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export enum FileExtensionTypes {
	FBX = 'fbx',
	GLTF = 'gltf'
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

export class FBXAssetLoader implements IAssetLoader {
	private loader: FBXLoader = new FBXLoader();

	isSupported(file: string): boolean {
		return file.toLowerCase().endsWith(FileExtensionTypes.FBX);
	}

	async load(file: string): Promise<AssetLoaderResult> {
		return new Promise((resolve, reject) => {
			this.loader.load(
				file,
				(object: Object3D) => {
					const animation = object.animations[0];
					resolve({
						object,
						animation
					});
				},
				undefined,
				reject
			);
		});
	}
}

export class GLTFAssetLoader implements IAssetLoader {
	private loader: GLTFLoader = new GLTFLoader();

	isSupported(file: string): boolean {
		return file.toLowerCase().endsWith(FileExtensionTypes.GLTF);
	}

	async load(file: string): Promise<AssetLoaderResult> {
		return new Promise((resolve, reject) => {
			this.loader.load(
				file,
				(gltf: GLTF) => {
					resolve({
						object: gltf.scene,
						gltf
					});
				},
				undefined,
				reject
			);
		});
	}
}

export class EntityAssetLoader {
	private loaders: IAssetLoader[] = [
		new FBXAssetLoader(),
		new GLTFAssetLoader()
	];

	async loadFile(file: string): Promise<AssetLoaderResult> {
		const loader = this.loaders.find(l => l.isSupported(file));

		if (!loader) {
			throw new Error(`Unsupported file type: ${file}`);
		}

		return loader.load(file);
	}
}
