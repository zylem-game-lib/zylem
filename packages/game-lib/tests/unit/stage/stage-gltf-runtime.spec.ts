import { Vector2 } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ZylemCamera } from '../../../src/lib/camera/zylem-camera';
import { Perspectives } from '../../../src/lib/camera/perspective';
import { assetManager } from '../../../src/lib/core/asset-manager';
import { ZylemScene } from '../../../src/lib/graphics/zylem-scene';
import { ZylemWorld } from '../../../src/lib/collision/world';
import { StageEntityDelegate } from '../../../src/lib/stage/stage-entity-delegate';
import { ZylemStage } from '../../../src/lib/stage/zylem-stage';

function createCamera(): ZylemCamera {
	return new ZylemCamera(Perspectives.ThirdPerson, new Vector2(800, 600));
}

function mockPhysicsWorld() {
	return {
		integrationParameters: {},
	} as any;
}

describe('ZylemStage GLTF runtime configuration', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('configures GLTF runtime before stage entity loading in the legacy camera path', async () => {
		const legacyRenderer = { kind: 'legacy-renderer' };
		const order: string[] = [];

		vi.spyOn(ZylemWorld, 'loadPhysics').mockResolvedValue(mockPhysicsWorld());
		vi.spyOn(ZylemScene.prototype, 'setupCamera').mockImplementation(
			async function mockSetupCamera(_scene, camera) {
				camera.setRendererManager({ renderer: legacyRenderer } as any);
			},
		);
		const configureGLTFRuntimeSpy = vi
			.spyOn(assetManager, 'configureGLTFRuntime')
			.mockImplementation(async (options) => {
				order.push('configure');
				expect(options).toEqual({
					ktx2TranscoderPath: '/three/basis/',
					renderer: legacyRenderer,
				});
			});
		const runEntityLoadGeneratorSpy = vi
			.spyOn(StageEntityDelegate.prototype, 'runEntityLoadGenerator')
			.mockImplementation(async function mockRunEntityLoadGenerator() {
				order.push('load');
			});

		const stage = new ZylemStage([
			{
				assetLoaders: {
					gltf: {
						ktx2TranscoderPath: '/three/basis/',
					},
				},
			},
		] as any);

		await stage.load('test-stage', createCamera());

		expect(configureGLTFRuntimeSpy).toHaveBeenCalledTimes(1);
		expect(runEntityLoadGeneratorSpy).toHaveBeenCalledTimes(1);
		expect(order).toEqual(['configure', 'load']);
	});

	it('uses the shared renderer manager renderer when one is provided', async () => {
		const sharedRenderer = { kind: 'shared-renderer' };
		const rendererManager = {
			renderer: sharedRenderer,
			setupRenderPass: vi.fn(),
			startRenderLoop: vi.fn(),
		};

		vi.spyOn(ZylemWorld, 'loadPhysics').mockResolvedValue(mockPhysicsWorld());
		const setupCameraSpy = vi.spyOn(
			ZylemScene.prototype,
			'setupCamera',
		);
		const setupCameraManagerSpy = vi
			.spyOn(ZylemScene.prototype, 'setupCameraManager')
			.mockResolvedValue(undefined);
		const configureGLTFRuntimeSpy = vi
			.spyOn(assetManager, 'configureGLTFRuntime')
			.mockResolvedValue(undefined);
		vi.spyOn(StageEntityDelegate.prototype, 'runEntityLoadGenerator')
			.mockResolvedValue(undefined);

		const stage = new ZylemStage([
			{
				assetLoaders: {
					gltf: {
						ktx2TranscoderPath: '/three/basis/',
					},
				},
			},
		] as any);

		await stage.load('test-stage', createCamera(), rendererManager as any);

		expect(setupCameraManagerSpy).toHaveBeenCalledTimes(1);
		expect(setupCameraSpy).not.toHaveBeenCalled();
		expect(rendererManager.setupRenderPass).toHaveBeenCalledTimes(1);
		expect(rendererManager.startRenderLoop).toHaveBeenCalledTimes(1);
		expect(configureGLTFRuntimeSpy).toHaveBeenCalledWith({
			ktx2TranscoderPath: '/three/basis/',
			renderer: sharedRenderer,
		});
	});
});
