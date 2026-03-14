import {
	AnimationClip,
	Bone,
	Object3D,
	VectorKeyframeTrack,
} from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntityAssetLoader } from '../../../src/lib/core/entity-asset-loader';
import { AnimationDelegate } from '../../../src/lib/entities/delegates/animation';

describe('AnimationDelegate', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('strips X/Z root motion while preserving vertical motion on the root bone track', async () => {
		const root = new Object3D();
		const hips = new Bone();
		hips.name = 'mixamorigHips';
		root.add(hips);

		const clip = new AnimationClip('idle', 1, [
			new VectorKeyframeTrack(
				'mixamorigHips.position',
				[0, 1],
				[
					1, 2, 3,
					5, 4, 7,
				],
			),
		]);

		vi.spyOn(EntityAssetLoader.prototype, 'loadFile').mockResolvedValue({
			animation: clip,
		});

		const delegate = new AnimationDelegate(root);
		await delegate.loadAnimations([{ key: 'idle', path: 'idle.fbx' }]);
		delegate.update(0.5);

		expect(hips.position.x).toBeCloseTo(1, 5);
		expect(hips.position.y).toBeCloseTo(3, 5);
		expect(hips.position.z).toBeCloseTo(3, 5);
	});
});
