import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera } from 'three';

export class ZylemCamera {
	cameraRig: Object3D;
	camera: Camera;
	// follow: Entity | null;

	constructor(screenResolution: Vector2) {
		let aspectRatio = screenResolution.x / screenResolution.y;
		this.camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
		// this.camera = new OrthographicCamera();
		this.camera.position.z = 20;
		this.camera.position.y = 6 * Math.tan(Math.PI / 3);
		// this.follow = null;
		this.cameraRig = new Object3D();
		this.cameraRig.position.set(0, 0, -50);
		this.cameraRig.add(this.camera);
		this.camera.lookAt(new Vector3(0, 0, 0));
	}

	update() {
		// if (this.follow) {
		// 	this.moveFollowCamera();
		// }
	}

	moveFollowCamera() {
		// const entity = this.follow;
		// const { x, y, z } = entity?.body.translation() || { x: 0, y: 0, z: 0 };
		// const entityPosition = new Vector3(x, y, z);
		// this.cameraRig.position.set(x, y, z);
		// this.camera.lookAt(entityPosition);
	}

	// followEntity(entity: Entity) {
	// 	this.follow = entity;
	// }
}