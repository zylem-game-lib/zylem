import {
	Box3,
	BoxGeometry,
	Color,
	EdgesGeometry,
	Group,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	Scene,
	Vector3,
} from 'three';

/**
 * Debug overlay that displays an axis-aligned bounding box around a target Object3D.
 * Shows a semi-transparent fill plus a wireframe outline. Intended for SELECT/DELETE tools.
 */
export class DebugEntityCursor {
	private scene: Scene;
	private container: Group;
	private fillMesh: Mesh;
	private edgeLines: LineSegments;
	private currentColor: Color = new Color(0x00ff00);
	private bbox: Box3 = new Box3();
	private size: Vector3 = new Vector3();
	private center: Vector3 = new Vector3();

	constructor(scene: Scene) {
		this.scene = scene;

		const initialGeometry = new BoxGeometry(1, 1, 1);

		this.fillMesh = new Mesh(
			initialGeometry,
			new MeshBasicMaterial({
				color: this.currentColor,
				transparent: true,
				opacity: 0.12,
				depthWrite: false,
			})
		);

		const edges = new EdgesGeometry(initialGeometry);
		this.edgeLines = new LineSegments(
			edges,
			new LineBasicMaterial({ color: this.currentColor, linewidth: 1 })
		);

		this.container = new Group();
		this.container.name = 'DebugEntityCursor';
		this.container.add(this.fillMesh);
		this.container.add(this.edgeLines);
		this.container.visible = false;

		this.scene.add(this.container);
	}

	setColor(color: Color | number): void {
		this.currentColor.set(color as any);
		(this.fillMesh.material as MeshBasicMaterial).color.set(this.currentColor);
		(this.edgeLines.material as LineBasicMaterial).color.set(this.currentColor);
	}

	/**
	 * Update the cursor to enclose the provided Object3D using a world-space AABB.
	 */
	updateFromObject(object: Object3D | null | undefined): void {
		if (!object) {
			this.hide();
			return;
		}

		this.bbox.setFromObject(object);
		if (!isFinite(this.bbox.min.x) || !isFinite(this.bbox.max.x)) {
			this.hide();
			return;
		}

		this.bbox.getSize(this.size);
		this.bbox.getCenter(this.center);

		const newGeom = new BoxGeometry(
			Math.max(this.size.x, 1e-6),
			Math.max(this.size.y, 1e-6),
			Math.max(this.size.z, 1e-6)
		);
		this.fillMesh.geometry.dispose();
		this.fillMesh.geometry = newGeom;

		const newEdges = new EdgesGeometry(newGeom);
		this.edgeLines.geometry.dispose();
		this.edgeLines.geometry = newEdges;

		this.container.position.copy(this.center);
		this.container.visible = true;
	}

	hide(): void {
		this.container.visible = false;
	}

	dispose(): void {
		this.scene.remove(this.container);
		this.fillMesh.geometry.dispose();
		(this.fillMesh.material as MeshBasicMaterial).dispose();
		this.edgeLines.geometry.dispose();
		(this.edgeLines.material as LineBasicMaterial).dispose();
	}
}


