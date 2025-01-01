import { Vector2, Camera, PerspectiveCamera, Vector3, Object3D, OrthographicCamera, WebGLRenderer, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { stageState } from '../state/index';
import { PerspectiveType, Perspectives } from '../interfaces/perspective';
import { StageEntity } from '../entities/stage-entity';

const zModifier = 100;

export class ZylemCamera {
	cameraRig: Object3D;
	camera: Camera;
	renderer: WebGLRenderer;
	_perspective: PerspectiveType;
	orbitControls: OrbitControls | null = null;
	target: GameEntity<any> | null = null;
	sceneRef: Scene | null = null;

	constructor(screenResolution: Vector2, renderer: WebGLRenderer, scene: Scene) {
		let aspectRatio = screenResolution.x / screenResolution.y;

		const z = 15;
		const position = new Vector3(0, 0, z);
		const gamePerspective = stageState.perspective as PerspectiveType;
		this.sceneRef = scene;
		this._perspective = gamePerspective;
		this.camera = this[gamePerspective](aspectRatio, position);
		this.cameraRig = new Object3D();
		this.cameraRig.position.set(0, 0, z);
		this.cameraRig.add(this.camera);
		this.camera.lookAt(new Vector3(0, 0, 0));

		this.renderer = renderer;
		if (this.orbitControls === null) {
			this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
			this.orbitControls.enableDamping = true;
			this.orbitControls.dampingFactor = 0.05;

			this.orbitControls.screenSpacePanning = false;

			this.orbitControls.minDistance = 1;
			this.orbitControls.maxDistance = 500;

			this.orbitControls.maxPolarAngle = Math.PI / 2;
		}
		this.renderer.setAnimationLoop(() => {
			// console.log(this.orbitControls);
			this.orbitControls?.update();
			// console.log(this.sceneRef, this.camera);
			// this.renderer.render(this.sceneRef, this.camera);
		});
	}

	[Perspectives.ThirdPerson](aspectRatio: number): Camera {
		console.warn('Third person camera not fully implemented');
		return new PerspectiveCamera(zModifier, aspectRatio, 0.1, 1000);
	}

	[Perspectives.Fixed2D](aspectRatio: number, position: Vector3): Camera {
		const frustumSize = position.z;
		const distance = position.distanceTo(new Vector3(0, 0, 0));
		// const orthographicCamera = new OrthographicCamera(
		// 	frustumSize * aspectRatio / -2,
		// 	frustumSize * aspectRatio / 2,
		// 	frustumSize / 2,
		// 	frustumSize / -2,
		// 	0.1,
		// 	1000 //distance * 2
		// );
		const orthographicCamera = new OrthographicCamera(
			10 * (-aspectRatio),
			10 * (aspectRatio),
			10,
			-10,
			0,
			2000
		);

		orthographicCamera.position.copy(position);
		return orthographicCamera;
	}

	[Perspectives.FirstPerson](): Camera {
		console.warn('First person camera not fully implemented');
		return new PerspectiveCamera(45, 1, 0.1, 1000);;
	}

	[Perspectives.Flat2D](aspectRatio: number, position: Vector3): Camera {
		console.warn('Flat2D camera not fully implemented');
		return this[Perspectives.Fixed2D](aspectRatio, position);
	}

	[Perspectives.Isometric](aspectRatio: number, position: Vector3): Camera {
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

	update() { }

	__update() {
		// this.orbitControls?.update();
	}

	private moveCamera(position: Vector3) {
		// const adjustedZ = (this._perspective !== Perspectives.Flat2D) ? position.z + zModifier : position.z;
		// this.cameraRig.position.set(position.x, position.y, adjustedZ);
	}

	move(position: Vector3) {
		// this.moveCamera(position);
	}

	rotate(pitch: number, yaw: number, roll: number) {
		this.cameraRig.rotateX(pitch);
		this.cameraRig.rotateY(yaw);
		this.cameraRig.rotateZ(roll);
	}
}