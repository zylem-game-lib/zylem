import { BoxGeometry, Color, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { Constructor } from "./composable";

export abstract class MeshObject {
	public texture: any;
	public shader: any;
}

export interface BoxMeshInterface {
	createMesh: () => void;
}

export function BoxMesh<CBase extends Constructor>(Base: CBase) {
	return class BoxMesh extends Base {
		size: Vector3 = new Vector3(1, 1, 1);
		color: Color = new Color('blue');
		mesh: Mesh = new Mesh(undefined, undefined);

		createMesh(vector3: Vector3 | undefined = new Vector3(1, 1, 1)) {
			this.size = vector3;
			const geometry = new BoxGeometry(vector3.x, vector3.y, vector3.z);
			const material = new MeshStandardMaterial({
				color: this.color,
				emissiveIntensity: 1,
				lightMapIntensity: 1,
				fog: true,
			});
			this.mesh = new Mesh(geometry, material);
			this.mesh.position.set(0, 0, 0);
			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;
		}
	}
}