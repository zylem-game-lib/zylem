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
		colliderDesc.activeCollisionTypes = (isSensor) ? ActiveCollisionTypes.KINEMATIC_FIXED : ActiveCollisionTypes.DEFAULT;
		return colliderDesc;
	}

	collision({ isDynamicBody = true }): RigidBodyDesc  {
		const type = isDynamicBody ? RigidBodyType.Dynamic : RigidBodyType.Fixed;
		const bodyDesc = new RigidBodyDesc(type)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(true);
		return bodyDesc;
	}
}

// debugColor: Color = new Color().setColorName('green');

type ZylemBoxOptions = {
	size?: SizeVector;
	static?: boolean;
	texture?: TexturePath;
	color?: Color;
}

// interface BoxOptions extends ZylemBoxOptions, LifecycleOptions<ZylemBox> {
// 	shader: ZylemShaderType;
// };

const boxDefaults: Partial<ZylemBoxOptions> = {
	size: new Vector3(1, 1, 1),
	static: false,
	texture: null,
	color: ZylemBlueColor,
	// shader: 'standard',
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

	public create() {
		throw new Error('Method not implemented.');
	}
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
		//group.add(mesh);
		return mesh;
	}
}

// interface ZylemBox extends Entity<ZylemBox>, BoxCollision, ZylemMaterial, BoxMesh { }
// applyMixins(ZylemBox, [Entity, StageEntity, Lifecycle, BoxCollision, ZylemMaterial, BoxMesh]);

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
	private meshBuilder: BoxMeshBuilder = null;
	private collisionBuilder: BoxCollisionBuilder = null;

	constructor(
		initialOptions: BoxOptions = {},
		meshBuilder: BoxMeshBuilder,
		collisionBuilder: BoxCollisionBuilder
	) {
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

// ... existing imports ...

// export class BoxBuilder {
//     private meshBuilder: BoxMeshBuilder;
//     private collisionBuilder: BoxCollisionBuilder;
//     private materialBuilder: ZylemMaterialBuilder;  // You'll need to create this
//     private options: Partial<BoxOptions>;

//     constructor(options?: Partial<BoxOptions>) {
//         this.options = { ...boxDefaults, ...options };
//         this.meshBuilder = new BoxMeshBuilder();
//         this.collisionBuilder = new BoxCollisionBuilder();
//         this.materialBuilder = new ZylemMaterialBuilder();
//     }

//     withSize(size: SizeVector): this {
//         this.meshBuilder.size = size;
//         this.collisionBuilder.collisionSize = size;
//         return this;
//     }

//     withStatic(isStatic: boolean): this {
//         this.collisionBuilder.static = isStatic;
//         return this;
//     }

//     withTexture(texture: TexturePath): this {
//         this.materialBuilder.setTexture(texture);
//         return this;
//     }

//     withColor(color: Color): this {
//         this.materialBuilder.setColor(color);
//         return this;
//     }

//     async build(): Promise<ZylemBox> {
//         const box = new ZylemBox(this.options);
        
//         // Build materials
//         box.materials = await this.materialBuilder.build();
        
//         // Build mesh
//         box.mesh = this.meshBuilder.build({
//             size: this.meshBuilder.size,
//             materials: box.materials
//         });
        
//         // Build collision
//         box.rigidBody = this.collisionBuilder.collision({ 
//             isDynamicBody: !this.collisionBuilder.static 
//         });
//         box.collider = this.collisionBuilder.collider(
//             this.collisionBuilder.isSensor
//         );

//         return box;
//     }
// }

// // Modify the box factory function to use the builder
// export function box(...args: Array<BoxOptions>): Promise<ZylemBox> {
//     const builder = new BoxBuilder();
    
//     for (const arg of args) {
//         if (arg instanceof BaseEntity) {
//             // Handle entity composition differently
//             continue;
//         }
//         // Apply options to builder
//         if (arg.size) builder.withSize(arg.size);
//         if (arg.static !== undefined) builder.withStatic(arg.static);
//         if (arg.texture) builder.withTexture(arg.texture);
//         if (arg.color) builder.withColor(arg.color);
//     }

//     return builder.build();
// }

// // Simplify ZylemBox to be more of a data container
// class ZylemBox extends BaseEntity<ZylemBoxOptions> {
//     public type = BOX_TYPE;
//     public group = new Group();
//     public mesh: Mesh;
//     public materials: Material[];
//     public rigidBody: RigidBodyDesc;
//     public collider: ColliderDesc;

//     constructor(options?: Partial<BoxOptions>) {
//         super();
//         this.options = { ...boxDefaults, ...options };
//     }
// }