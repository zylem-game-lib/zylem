import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat';
import { BoxGeometry, BufferGeometry, Group, Material, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { Color, Vector3 } from 'three';
import { SizeVector } from '~/lib/interfaces/utility';
import { MaterialBuilder, TexturePath, ZylemMaterial } from '../core/material';
import { ZylemBlueColor } from '../interfaces/utility';
import { Behavior } from '~/lib/behaviors/behavior';
import { position, rotation, scale } from "~/lib/behaviors/components/transform";
import { ZylemShaderType } from '~/lib/core/preset-shader';
import { CreateMeshParameters } from '~/lib/core/mesh';
import { BaseEntity } from '../core/entity/base-entity';

export class BoxCollisionBuilder {
	static: boolean = false;
	isSensor: boolean = false;

	bodyDescription: RigidBodyDesc | null = null;
	collisionSize: SizeVector = new Vector3(1, 1, 1);

	collider(isSensor: boolean = false): ColliderDesc {
		const size = this.collisionSize || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		const { KINEMATIC_FIXED, DEFAULT } = ActiveCollisionTypes;
		colliderDesc.activeCollisionTypes = (isSensor) ? KINEMATIC_FIXED : DEFAULT;
		return colliderDesc;
	}

	collision({ isDynamicBody = true }): RigidBodyDesc {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		const bodyDesc = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
		return bodyDesc;
	}
}

type ZylemBoxOptions = {
	size?: SizeVector;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
	shader?: ZylemShaderType
}

const boxDefaults: ZylemBoxOptions = {
	size: new Vector3(1, 1, 1),
	static: false,
	texture: null,
	color: ZylemBlueColor,
	shader: 'standard'
};

export const BOX_TYPE = Symbol('Box');

class ZylemBox extends BaseEntity<ZylemBoxOptions> {
	public type = BOX_TYPE;
	public group = new Group();
	public mesh: Mesh | undefined;
	public materials: Material[] | undefined;
	public rigidBody: RigidBodyDesc | undefined;
	public collider: ColliderDesc | undefined;

	constructor(options?: ZylemBoxOptions) {
		super();
		this.options = { ...boxDefaults, ...options };
	}

	public async create() {
		console.log(this);
		this.behaviors = [
			{ component: position, values: { x: 0, y: 0, z: 0 } },
			{ component: scale, values: { x: 0, y: 0, z: 0 } },
			{ component: rotation, values: { x: 0, y: 0, z: 0, w: 0 } },
		];
		return this;
	}

	// public update(args) {
	// console.log(args);
	// }
}

export class BoxMeshBuilder {
	size: SizeVector = new Vector3(1, 1, 1);

	mesh({ size, materials }: CreateMeshParameters): Mesh<BoxGeometry, Material> {
		const meshSize = size ?? new Vector3(1, 1, 1);
		const geometry = new BoxGeometry(meshSize.x, meshSize.y, meshSize.z);
		const mesh = new Mesh(geometry, materials.at(-1));
		mesh.position.set(0, 0, 0);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}
}

type BoxOptions = BaseEntity | ZylemBoxOptions;

export async function box(...args: Array<BoxOptions>): Promise<ZylemBox> {
	const builder = new BoxBuilder();
	for (const arg of args) {
		if (arg instanceof BaseEntity) {
			continue;
		}
		if (arg.size) builder.withSize(arg.size);
		if (arg.static !== undefined) builder.withStatic(arg.static);
		if (arg.color) builder.withColor(arg.color);
		if (arg.texture) await builder.withTexture(arg.texture);
		if (arg.shader) builder.withShader(arg.shader);
	}

	return await builder.build();
}

export class BoxBuilder {
	private meshBuilder: BoxMeshBuilder;
	private collisionBuilder: BoxCollisionBuilder;
	private materialBuilder: MaterialBuilder;
	private options: Partial<ZylemBoxOptions>;

	constructor(options?: Partial<ZylemBoxOptions>) {
		this.options = { ...boxDefaults, ...options };
		this.meshBuilder = new BoxMeshBuilder();
		this.collisionBuilder = new BoxCollisionBuilder();
		this.materialBuilder = new MaterialBuilder();
	}

	withSize(size: SizeVector): this {
		this.meshBuilder.size = size;
		this.collisionBuilder.collisionSize = size;
		return this;
	}

	withStatic(isStatic: boolean): this {
		this.collisionBuilder.static = isStatic;
		return this;
	}

	async withTexture(texture: TexturePath): Promise<this> {
		await this.materialBuilder.setTexture(texture);
		return this;
	}

	withColor(color: Color): this {
		this.materialBuilder.setColor(color);
		return this;
	}

	withShader(shaderType: ZylemShaderType): this {
		this.materialBuilder.setShader(shaderType);
		return this;
	}

	async build(): Promise<ZylemBox> {
		const box = new ZylemBox(this.options);

		box.materials = this.materialBuilder.materials;

		box.mesh = this.meshBuilder.mesh({
			size: this.meshBuilder.size,
			materials: box.materials,
			group: box.group
		});
		box.group.add(box.mesh);

		box.rigidBody = this.collisionBuilder.collision({
			isDynamicBody: !this.collisionBuilder.static
		});
		box.collider = this.collisionBuilder.collider(
			this.collisionBuilder.isSensor
		);

		return box;
	}
}

// 	// zylemBox._behaviors = [
// 	// 	{ component: position, values: { x: 0, y: 0, z: 0 } },
// 	// 	{ component: scale , values: { x: 0, y: 0, z: 0 } },
// 	// 	{ component: rotation , values: { x: 0, y: 0, z: 0, w: 0 } },
// 	// 	...behaviors
// 	// ];
// shader: 'standard',
// interface BoxOptions extends ZylemBoxOptions, LifecycleOptions<ZylemBox> {
// 	shader: ZylemShaderType;
// };