import { ActiveCollisionTypes, ColliderDesc, RigidBodyDesc, RigidBodyType } from '@dimforge/rapier3d-compat';
import { BoxGeometry, BufferGeometry, Group, Material, Mesh, Object3D } from 'three';
import { Color, Vector3 } from 'three';
import { SizeVector } from '~/lib/interfaces/utility';
import { Entity, EntityOptions, StageEntity } from '../core';
import { TexturePath, ZylemMaterial } from '../core/material';
import { ZylemBlueColor } from '../interfaces/utility';
import { Behavior } from '~/lib/behaviors/behavior';
import { Lifecycle, LifecycleOptions } from '~/lib/core/entity-life-cycle';
import { applyMixins } from '~/lib/core/composable';
// import { position, rotation, scale } from "~/lib/behaviors/transform";
import { ZylemShaderType } from '~/lib/core/preset-shader';
import { CreateMeshParameters } from '~/lib/core/mesh';
import { BaseEntity } from '../core/base-entity';


export class BoxCollision {
	_static: boolean = false;
	_isSensor: boolean = false;
	bodyDescription: RigidBodyDesc | null = null;
	debugCollision: boolean = false;
	debugColor: Color = new Color().setColorName('green');
	collisionSize: SizeVector = new Vector3(1, 1, 1);

	createCollider(isSensor: boolean = false) {
		const size = this.collisionSize || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}

	createCollision({ isDynamicBody = true }) {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		this.bodyDescription = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
	}
}


type ZylemBoxOptions = {
	size?: SizeVector;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

// interface BoxOptions extends ZylemBoxOptions, LifecycleOptions<ZylemBox> {
// 	shader: ZylemShaderType;
// };

const boxDefaults: Partial<BoxOptions> = {
	size: new Vector3(1, 1, 1),
	static: false,
	texture: null,
	color: ZylemBlueColor,
	// shader: 'standard',
};

class ZylemBox extends BaseEntity{
	public type = 'Box';
	options: Partial<BoxOptions> = boxDefaults;
	group = {} as Group;

	constructor(options?: Partial<BoxOptions>) {
		super();
		if (!options) {
			return;
		}
		this.options = options;
	}

	async create(): Promise<this> {
		await this.createMaterials({
			texture: this._texture,
			color: this._color,
			repeat: this._repeat,
			shader: this._shader
		});
		this.createMesh({
			group: this.group,
			size: this._size,
			materials: this.materials
		});
		this.createCollision({ isDynamicBody: !this._static });
		return Promise.resolve(this);
	}

	operation() {
		return 'ZylemBox';
	}
}

export class BoxMesh {
	_size: SizeVector = new Vector3(1, 1, 1);
	mesh: Mesh<BufferGeometry, Material | Material[]> | null = null;

	createMesh({ group = new Group(), size, materials }: CreateMeshParameters) {
		const meshSize = size ?? new Vector3(1, 1, 1);
		const geometry = new BoxGeometry(meshSize.x, meshSize.y, meshSize.z);
		this.mesh = new Mesh(geometry, materials.at(-1));
		this.mesh.position.set(0, 0, 0);
		this.mesh.castShadow = true;
		this.mesh.receiveShadow = true;
		group.add(this.mesh);
	}
}

interface ZylemBox extends Entity<ZylemBox>, BoxCollision, ZylemMaterial, BoxMesh { }
applyMixins(ZylemBox, [Entity, StageEntity, Lifecycle, BoxCollision, ZylemMaterial, BoxMesh]);

// export function box(options: Partial<BoxOptions> = boxDefaults, ...behaviors: Behavior[]): ZylemBox {
// 	const zylemBox = new ZylemBox(options) as ZylemBox;
// 	zylemBox.entityDefaults(options as EntityOptions<ZylemBox>);
// 	// zylemBox.lifecycleDefaults(options as LifecycleOptions<ZylemBox>);
// 	// zylemBox.stageEntityDefaults();
// 	zylemBox._static = options.static ?? boxDefaults.static!;
// 	zylemBox._texture = options.texture ?? boxDefaults.texture!;
// 	zylemBox._size = options.size ?? boxDefaults.size!;
// 	zylemBox.collisionSize = options.size ?? boxDefaults.size!;
// 	zylemBox._color = options.color ?? boxDefaults.color!;
// 	zylemBox._shader = options.shader ?? boxDefaults.shader!;
// 	// zylemBox._behaviors = [
// 	// 	{ component: position, values: { x: 0, y: 0, z: 0 } },
// 	// 	{ component: scale , values: { x: 0, y: 0, z: 0 } },
// 	// 	{ component: rotation , values: { x: 0, y: 0, z: 0, w: 0 } },
// 	// 	...behaviors
// 	// ];
// 	return zylemBox;
// }

type BoxOptions = BaseEntity | ZylemBoxOptions;

export function box(...args: Array<BoxOptions>): ZylemBox {
	const instance = new ZylemBox();
    
	for (const arg of args) {
		if (arg instanceof BaseEntity) {
			instance.add(arg);
		} else {
			instance.setOptions(arg);
		}
	}

	return instance;
}


type BoxBehavior = (box: ZylemBox) => Promise<void> | void;

class ZylemBoxBuilder {
	private box: ZylemBox;
	private behaviors: BoxBehavior[] = [];

	constructor(initialOptions: BoxOptions = {}) {
		this.box = new ZylemBox(initialOptions);
	}

	use(behavior: BoxBehavior): this {
		this.behaviors.push(behavior);
		return this;
	}

	async build(): Promise<ZylemBox> {
		for (const behavior of this.behaviors) {
			await behavior(this.box);
		}
		return this.box;
	}
}

// // Define reusable behaviors
// const meshBehavior: BoxBehavior = async (box) => {
//     const size = box.options.size ?? 1;//new Vector3(1, 1, 1);
//     const group = new Group();
//     box.createMesh({
//         group,
//         size,
//         materials: box.materials
//     });
// };

// const collisionBehavior: BoxBehavior = (box) => {
//     // box.createCollision({ isDynamicBody: !box._static });
// };

// const colorBehavior: BoxBehavior = (box) => {
//     box._color = new Color().setColorName('blue');
// };

// // Build the ZylemBox with behaviors
// const boxBuilder = new ZylemBoxBuilder({ size: 2, color: 'green' });