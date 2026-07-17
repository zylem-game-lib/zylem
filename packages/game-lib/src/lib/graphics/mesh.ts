import { BufferGeometry, Material, Mesh } from 'three';
import { GameEntityOptions } from '../entities/entity';

/**
 * TODO: allow for multiple materials requires geometry groups
 * TODO: allow for instanced uniforms
 * TODO: allow for geometry groups
 */

export type MeshBuilderOptions = Partial<Pick<GameEntityOptions, 'material'>>;

export class MeshBuilder {

	_build(_meshOptions: MeshBuilderOptions, geometry: BufferGeometry, materials: Material[]): Mesh {
		const mesh = new Mesh(geometry, materials.at(-1));
		mesh.position.set(0, 0, 0);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}

	_postBuild(): void {
		return;
	}
}
