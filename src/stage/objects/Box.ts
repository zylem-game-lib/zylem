import { Body, Box, Vec3 } from 'cannon-es';
import { EntityOptions, GameEntity } from '@/interfaces/Entity';
import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';

// Box is a combination of a 3D mesh and a physics body
export class ZylemBox implements GameEntity<ZylemBox> {
	type: string;
	mesh: Mesh;
	body: Body;

	constructor(options: EntityOptions) {
		this.type = 'Box';
		this.mesh = this.createMesh();
		this.body = this.createBody();
	}
	setup() { }
	destroy() { }
	update(delta: number) {
		if (!this.body) {
			return;
		}
		const { x, y, z } = this.body.position;
		this.mesh.position.set(x, y, z);
	}

	createMesh() {
		// const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
		const geometry = new BoxGeometry(10, 10, 10);
		const material = new MeshStandardMaterial({
			color: 0xFFFFFF,
			emissiveIntensity: 0.5,
			lightMapIntensity: 0.5,
			fog: true,
		});
		this.mesh = new Mesh(geometry, material);
		// this.mesh.position.set(position.x, position.y, position.z);
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		return this.mesh;
	}

	createBody() {
		// this.body = new Box(new Vec3(size.x, size.y, size.z));
		// this.body.position.set(position.x, position.y, position.z);
		const box = new Box(new Vec3(1, 1, 1));
		this.body = new Body({
			mass: 1,
			shape: box,
		});
		this.body.position.set(0, 0, 0);
		return this.body;
	}
}