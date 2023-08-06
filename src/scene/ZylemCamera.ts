import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera } from 'three';
import { GameState } from '@state/index';
import { PerspectiveType } from '@interfaces/Perspective';

export class ZylemCamera {
	cameraRig: Object3D;
	camera: Camera;
	// follow: Entity | null;

	constructor(screenResolution: Vector2) {
		let aspectRatio = screenResolution.x / screenResolution.y;

		const z = 25;
		const position = new Vector3(0, 0, z);
		const gamePerspective = GameState.state.perspective;
		this.camera = this[gamePerspective](aspectRatio, position);
		this.cameraRig = new Object3D();
		this.cameraRig.position.set(0, 0, z);
		this.cameraRig.add(this.camera);
		this.camera.lookAt(new Vector3(0, 0, 0));
	}

	[PerspectiveType.ThirdPerson](aspectRatio: number): Camera {
		console.warn('Third person camera not fully implemented');
		return new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
	}

	[PerspectiveType.Fixed2D](aspectRatio: number, position: Vector3): Camera {
		const frustumSize = position.z;
		const distance = position.distanceTo(new Vector3(0, 0, 0));
		const orthographicCamera = new OrthographicCamera(
			frustumSize * aspectRatio / -2,
			frustumSize * aspectRatio / 2,
			frustumSize / 2,
			frustumSize / -2,
			0.1,
			distance * 2
		);

		orthographicCamera.position.copy(position);
		return orthographicCamera;
	}

	[PerspectiveType.FirstPerson](): Camera {
		console.warn('First person camera not fully implemented');
		return new PerspectiveCamera(45, 1, 0.1, 1000);;
	}

	[PerspectiveType.Flat2D](aspectRatio: number, position: Vector3): Camera {
		console.warn('Flat2D camera not fully implemented');
		return this[PerspectiveType.Fixed2D](aspectRatio, position);
	}

	[PerspectiveType.Isometric](aspectRatio: number, position: Vector3): Camera {
		console.warn('Isometric camera not fully implemented');
		const frustumSize = 20;
		const isometricCamera = new OrthographicCamera(
			frustumSize * aspectRatio / -2,
			frustumSize * aspectRatio / 2,
			frustumSize / 2,
			frustumSize / -2,
			0.1,
			position.z * 2
		);
		isometricCamera.position.copy(position);
		isometricCamera.lookAt(new Vector3(0, 0, 0));

		isometricCamera.rotation.set(
			Math.atan(-1 / Math.sqrt(2)),
			0,
			0,
			'YXZ'
		);
		return isometricCamera;
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