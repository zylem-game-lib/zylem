import { describe, expect, it, vi } from 'vitest';
import {
	BoxGeometry,
	Mesh,
	MeshBasicMaterial,
	Vector2,
	Vector3,
} from 'three';
import type { IWorld } from 'bitecs';

import { GameEntity } from '../../../src/lib/entities/entity';
import { Perspectives } from '../../../src/lib/camera/perspective';
import { ZylemCamera } from '../../../src/lib/camera/zylem-camera';
import {
	ScreenVisibilityBehavior,
	type ScreenVisibilityHandle,
} from '../../../src/lib/behaviors/screen-visibility';

function createEntity(size: Vector3, position: Vector3): GameEntity<any> {
	const entity = new GameEntity<any>();
	entity.options = { size, position } as any;
	entity.mesh = new Mesh(
		new BoxGeometry(size.x, size.y, size.z),
		new MeshBasicMaterial(),
	);
	entity.mesh.position.copy(position);
	return entity;
}

function createCamera(
	name: string,
	position: Vector3 = new Vector3(0, 0, 10),
	lookAt: Vector3 = new Vector3(0, 0, 0),
): ZylemCamera {
	const camera = new ZylemCamera(
		Perspectives.Fixed2D,
		new Vector2(1000, 1000),
		10,
	);
	camera.name = name;
	camera.camera.position.copy(position);
	camera.camera.lookAt(lookAt);
	camera.camera.updateProjectionMatrix();
	camera.camera.updateMatrixWorld(true);
	return camera;
}

function createSystem(
	entity: GameEntity<any>,
	cameras: ZylemCamera[],
) {
	const ref = entity.getBehaviorRefs()[0];
	return ScreenVisibilityBehavior.systemFactory({
		world: {},
		ecs: {} as IWorld,
		scene: {
			zylemCamera: cameras[0] ?? null,
			cameraManager: cameras.length > 0
				? { activeCameras: cameras }
				: null,
		},
		getBehaviorLinks: (key: symbol) =>
			key === ScreenVisibilityBehavior.key
				? [{ entity, ref }]
				: [],
	});
}

describe('ScreenVisibilityBehavior', () => {
	it('reports visible entities inside the active camera frustum', () => {
		const entity = createEntity(new Vector3(2, 2, 2), new Vector3(0, 0, 0));
		const handle = entity.use(ScreenVisibilityBehavior) as ScreenVisibilityHandle;
		const camera = createCamera('main');
		const system = createSystem(entity, [camera]);

		system.update({} as IWorld, 1 / 60);

		expect(handle.isVisible()).toBe(true);
		expect(handle.wasJustEntered()).toBe(true);
		expect(handle.getVisibleCameraNames()).toEqual(['main']);
		expect(handle.getState()).toMatchObject({
			visible: true,
			justEntered: true,
			justExited: false,
		});
	});

	it('fires enter and exit transitions as visibility changes', () => {
		const onEnter = vi.fn();
		const onExit = vi.fn();
		const onChange = vi.fn();
		const entity = createEntity(new Vector3(2, 2, 2), new Vector3(0, 0, 0));
		const handle = entity.use(ScreenVisibilityBehavior, {
			onEnter,
			onExit,
			onChange,
		}) as ScreenVisibilityHandle;
		const camera = createCamera('main');
		const system = createSystem(entity, [camera]);

		system.update({} as IWorld, 1 / 60);
		entity.mesh!.position.set(100, 0, 0);
		system.update({} as IWorld, 1 / 60);

		expect(handle.isVisible()).toBe(false);
		expect(handle.wasJustExited()).toBe(true);
		expect(onEnter).toHaveBeenCalledTimes(1);
		expect(onExit).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenCalledTimes(2);
	});

	it('can require full visibility instead of partial intersection', () => {
		const entity = createEntity(new Vector3(4, 4, 1), new Vector3(4.5, 0, 0));
		const partialHandle = entity.use(ScreenVisibilityBehavior) as ScreenVisibilityHandle;
		const fullHandle = entity.use(ScreenVisibilityBehavior, {
			requireFullyVisible: true,
		}) as ScreenVisibilityHandle;
		const camera = createCamera('main');
		const partialSystem = ScreenVisibilityBehavior.systemFactory({
			world: {},
			ecs: {} as IWorld,
			scene: {
				zylemCamera: camera,
				cameraManager: { activeCameras: [camera] },
			},
			getBehaviorLinks: (key: symbol) =>
				key === ScreenVisibilityBehavior.key
					? [
						{ entity, ref: entity.getBehaviorRefs()[0] },
						{ entity, ref: entity.getBehaviorRefs()[1] },
					]
					: [],
		});

		partialSystem.update({} as IWorld, 1 / 60);

		expect(partialHandle.isVisible()).toBe(true);
		expect(fullHandle.isVisible()).toBe(false);
	});

	it('supports filtering visibility against one named camera', () => {
		const entity = createEntity(new Vector3(2, 2, 2), new Vector3(0, 0, 0));
		const handle = entity.use(ScreenVisibilityBehavior, {
			cameraName: 'hud',
		}) as ScreenVisibilityHandle;
		const mainCamera = createCamera('main');
		const hudCamera = createCamera(
			'hud',
			new Vector3(20, 0, 10),
			new Vector3(20, 0, 0),
		);
		const system = createSystem(entity, [mainCamera, hudCamera]);

		system.update({} as IWorld, 1 / 60);

		expect(handle.isVisible()).toBe(false);
		expect(handle.getVisibleCameraNames()).toEqual([]);
	});
});
