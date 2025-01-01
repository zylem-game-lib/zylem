import { Vector3 } from 'three';
import { Mixin } from 'ts-mixer';
import { ZylemCamera } from '~/lib/camera/camera';

export class ThirdPersonCamera extends Mixin(ZylemCamera) {
	distance: Vector3 = new Vector3(0, 0, -30);

	setup() { }

	update() {
		if (!this.target) {
			return;
		}
		const desiredCameraPosition = this.target.group.position.clone().add(this.distance);
		this.camera.position.lerp(desiredCameraPosition, 0.1);
		this.camera.lookAt(this.target.group.position);
	}
}