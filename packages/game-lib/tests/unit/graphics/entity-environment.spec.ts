import { Color, CubeCamera, Group, Mesh, RenderTarget, Scene } from 'three';
import { NodeFrame, WebGPURenderer, type Node } from 'three/webgpu';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSphere } from '../../../src/api/entity';
import { EntityEnvironmentMaterial, markEnvironmentCaptureRoot } from '../../../src/lib/graphics/entity-environment';

function captureNode(material: EntityEnvironmentMaterial): Node {
	let capture: Node | undefined;
	material.colorNode!.traverse(node => {
		if (node.updateBeforeType === 'frame') capture = node;
	});
	if (!capture) throw new Error('Missing environment capture');
	return capture;
}

afterEach(() => vi.restoreAllMocks());

describe('entity environment materials', () => {
	it('builds independent tinted, opacity-aware surfaces through the entity API', () => {
		const sphere = createSphere({ material: { environment: 'bubble', color: new Color('cyan'), opacity: 0.6 } });
		const material = sphere.mesh!.material as EntityEnvironmentMaterial;
		expect(material).toBeInstanceOf(EntityEnvironmentMaterial);
		expect(material.color.getHex()).toBe(0x00ffff);
		expect(material.transparent).toBe(true);
		expect(material.opacity).toBe(0.6);
		const clone = material.clone();
		expect(captureNode(clone)).not.toBe(captureNode(material));
		expect(sphere.clone().mesh!.material).not.toBe(material);
	});

	it('captures from the world-space entity root, skips shadow and nested passes, and frees detached targets', () => {
		const material = new EntityEnvironmentMaterial({ type: 'reflection', resolution: 64, updateInterval: 3 });
		const mesh = new Mesh(undefined, material);
		const scene = new Scene();
		const parent = new Group();
		parent.position.set(4, 1, 0);
		const root = new Group();
		root.position.set(2, 0, 3);
		mesh.position.y = 5;
		scene.add(parent);
		parent.add(root);
		root.add(mesh);
		markEnvironmentCaptureRoot(root);

		const node = captureNode(material);
		const frame = new NodeFrame();
		const renderer = new WebGPURenderer();
		const previousTarget = new RenderTarget();
		renderer.setRenderTarget(previousTarget);
		renderer.autoClear = false;
		Object.assign(frame, { renderer, scene, object: mesh, frameId: 5 });
		const dispose = vi.fn();
		const capture = vi.spyOn(CubeCamera.prototype, 'update').mockImplementation(function () {
			expect(this.position.toArray()).toEqual([6, 1, 3]);
			expect(this.renderTarget.width).toBe(64);
			expect(root.visible).toBe(false);
			expect(parent.visible).toBe(true);
			expect(node.updateBefore(frame)).toBe(false);
			this.renderTarget.addEventListener('dispose', dispose);
			renderer.setRenderTarget(this.renderTarget);
		});

		// A shadow override can reference the same node before the main draw.
		frame.updateBeforeNode(node);
		expect(capture).not.toHaveBeenCalled();
		frame.material = material;
		frame.updateBeforeNode(node);
		frame.updateBeforeNode(node);
		frame.frameId++;
		frame.updateBeforeNode(node);
		expect(capture).toHaveBeenCalledTimes(1);
		expect(renderer.getRenderTarget()).toBe(previousTarget);
		expect(renderer.autoClear).toBe(false);
		expect(root.visible).toBe(true);

		frame.frameId += 2;
		frame.updateBeforeNode(node);
		expect(capture).toHaveBeenCalledTimes(2);
		root.removeFromParent();
		expect(dispose).toHaveBeenCalledTimes(1);
		parent.add(root);
		frame.frameId++;
		frame.updateBeforeNode(node);
		expect(capture).toHaveBeenCalledTimes(3);

		frame.frameId += 3;
		capture.mockImplementationOnce(function () {
			renderer.setRenderTarget(this.renderTarget);
			throw new Error('interrupted capture');
		});
		expect(() => frame.updateBeforeNode(node)).toThrow('interrupted capture');
		expect(root.visible && material.visible).toBe(true);
		expect(renderer.getRenderTarget()).toBe(previousTarget);
		frame.frameId++;
		frame.updateBeforeNode(node);
		expect(capture).toHaveBeenCalledTimes(5);
		material.dispose();
		expect(dispose).toHaveBeenCalledTimes(2);
	});
});
