import { describe, expect, it } from 'vitest';
import { Group, Vector2, Vector3 } from 'three';

import { Perspectives } from '../../../src/lib/camera/perspective';
import { ZylemCamera } from '../../../src/lib/camera/zylem-camera';
import { GameEntity } from '../../../src/lib/entities/entity';
import { ZylemScene } from '../../../src/lib/graphics/zylem-scene';

describe('ZylemScene', () => {
	it('does not reparent camera-attached entities back into the scene', () => {
		const camera = new ZylemCamera(Perspectives.ThirdPerson, new Vector2(800, 600));
		const scene = new ZylemScene('test-scene', camera, {
			backgroundColor: '#000000',
			backgroundImage: null,
			backgroundShader: null,
		});
		const entity = new GameEntity();
		entity.group = new Group();
		entity.options = {
			position: new Vector3(4, 5, 6),
		} as any;

		camera.camera.add(entity.group);

		scene.addEntityGroup(entity);

		expect(entity.group.parent).toBe(camera.camera);
		expect(scene.scene.children.includes(entity.group)).toBe(false);
	});
});
