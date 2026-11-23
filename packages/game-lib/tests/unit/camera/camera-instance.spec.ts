import { Group, Mesh, Scene, Vector2 } from 'three';
import { RenderPipeline } from 'three/webgpu';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCamera } from '../../../src/lib/camera/camera';
import { RendererManager, type ZylemRenderer } from '../../../src/lib/camera/renderer-manager';
import { createScreenShake } from '../../../src/lib/camera/screen-shake';
import { Perspectives } from '../../../src/lib/camera/perspective';
import type { CameraBehavior } from '../../../src/lib/camera/types';

afterEach(() => vi.restoreAllMocks());

function makeCamera() {
	return createCamera({ position: [0, 0, 10], target: [0, 0, 0], screenResolution: [800, 600] });
}

describe('camera instance', () => {
	it('uses a primitive mesh under a parent as the second-person observer', () => {
		const camera = createCamera({ perspective: Perspectives.SecondPerson, screenResolution: [800, 600] });
		const subject = new Group();
		subject.position.set(0, 0, 2);
		const balcony = new Group();
		balcony.position.set(3, 0, 0);
		const observer = new Mesh();
		observer.position.set(1, 2, 5);
		balcony.add(observer);
		camera.addTarget({ group: subject });
		camera.addTarget({ mesh: observer });
		camera.cameraRef.update(1 / 60);
		expect(camera.getState().finalPose?.position.toArray()).toEqual([4, 3.7, 5]);
		expect(camera.getState().finalPose?.lookAt?.toArray()).toEqual([0, 0, 2]);
	});

	it('attaches a keyed behavior once and detaches it on replacement or removal', () => {
		const camera = makeCamera();
		const makeBehavior = () => ({
			update: vi.fn<CameraBehavior['update']>((_, pose) => pose),
			onAttach: vi.fn(),
			onDetach: vi.fn(),
		});
		const original = makeBehavior();
		const next = makeBehavior();
		camera.useBehavior('follow', original);
		camera.cameraRef.update(1 / 60);
		camera.useBehavior('follow', original);
		expect(original.onAttach).toHaveBeenCalledTimes(1);
		camera.addBehavior('follow', next);
		expect(original.onDetach).toHaveBeenCalledTimes(1);
		expect(next.onAttach).toHaveBeenCalledTimes(1);
		expect(camera.unuseBehavior('follow')).toBe(true);
		expect(camera.removeBehavior('follow')).toBe(false);
		expect(next.onDetach).toHaveBeenCalledTimes(1);
	});

	it('moves through appended waypoints on time and holds the last pose until cleared', () => {
		const camera = makeCamera();
		camera.cameraRef.update(0);
		camera.addWaypoints({ position: [4, 0, 10], lookAt: [4, 0, 0], duration: 1, easing: 'linear' });
		camera.cameraRef.update(0.5);
		expect(camera.getState().finalPose?.position.toArray()).toEqual([2, 0, 10]);
		expect(camera.getState().finalPose?.lookAt?.toArray()).toEqual([2, 0, 0]);

		camera.addWaypoints({ position: [4, 0, 18], duration: 2, easing: 'linear' });
		camera.cameraRef.update(1);
		expect(camera.getState().finalPose?.position.toArray()).toEqual([4, 0, 12]);
		camera.cameraRef.update(3);
		camera.cameraRef.update(1);
		expect(camera.getState().finalPose?.position.toArray()).toEqual([4, 0, 18]);
		camera.clearWaypoints();
		camera.cameraRef.update(1);
		expect(camera.getState().desiredPose?.position.toArray()).toEqual([0, 0, 10]);
	});

	it('expires a shake and returns to the underlying perspective', () => {
		const camera = makeCamera();
		camera.cameraRef.pipeline.damping = 1;
		camera.cameraRef.update(0);
		camera.addAction(createScreenShake({ duration: 0.25, frequency: 5 }));
		camera.cameraRef.update(0.05);
		expect(camera.getState().finalPose?.position.x).toBeGreaterThan(0);
		expect(camera.getState().activeActionCount).toBe(1);
		camera.cameraRef.update(0.25);
		expect(camera.getState().activeActionCount).toBe(0);
		expect(camera.getState().finalPose?.position.toArray()).toEqual([0, 0, 10]);
	});

	it('draws an effect only for its camera and rebuilds the graph after changes', () => {
		const renderer = new RendererManager(new Vector2(800, 600));
		const drawScene = vi.fn();
		renderer.renderer = {
			render: drawScene, clear: vi.fn(), setViewport: vi.fn(), setScissor: vi.fn(), setScissorTest: vi.fn(),
		} as unknown as ZylemRenderer;
		const drawEffects = vi.spyOn(RenderPipeline.prototype, 'render').mockImplementation(() => {});
		const main = makeCamera();
		const inset = makeCamera();
		main.setViewport(0, 0, 0.5, 1);
		inset.setViewport(0.5, 0, 0.5, 1);
		const passes: { strength: number; view: unknown }[] = [];
		inset.addEffect('tint', {
			options: { strength: 0.4 },
			apply(input, { camera }, { strength }) {
				passes.push({ strength, view: camera });
				return input;
			},
		});
		const scene = new Scene();
		const draw = () => renderer.renderCameras(scene, [main.cameraRef, inset.cameraRef]);
		draw();
		draw();
		expect(passes).toEqual([{ strength: 0.4, view: inset.cameraRef.camera }]);
		expect(drawEffects).toHaveBeenCalledTimes(2);
		expect(drawScene.mock.calls.map(([, view]) => view)).toEqual([main.cameraRef.camera, main.cameraRef.camera]);

		expect(inset.updateEffect('tint', { strength: 0.8 })).toBe(true);
		draw();
		expect(passes.at(-1)?.strength).toBe(0.8);
		inset.cameraRef.setRendererManager(renderer);
		inset.setPerspective(Perspectives.TopDown);
		draw();
		expect(passes.at(-1)?.view).toBe(inset.cameraRef.camera);
		expect(inset.removeEffect('tint')).toBe(true);
		draw();
		expect(drawEffects).toHaveBeenCalledTimes(4);
		expect(drawScene.mock.calls.at(-1)?.[1]).toBe(inset.cameraRef.camera);
		renderer.dispose();
	});
});
