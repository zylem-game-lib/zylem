import { EntityClass, EntityOptions, GameEntity } from "@/interfaces/Entity";
import { RigidBody, RigidBodyDesc, ColliderDesc, RigidBodyType, ActiveCollisionTypes } from "@dimforge/rapier3d-compat";
import { Mesh, BufferGeometry, Material, Vector3, TextureLoader, SRGBColorSpace, SpriteMaterial, Sprite, PlaneGeometry, BoxGeometry, MeshStandardMaterial } from "three";

export class ZylemSprite extends EntityClass implements GameEntity<ZylemSprite> {
	mesh: Mesh<BufferGeometry, Material | Material[]>;
	body?: RigidBody | undefined;
	bodyDescription: RigidBodyDesc;
	constraintBodies?: RigidBody[] | undefined;
	_update: (delta: number, options: any) => void;
	_setup: (entity: ZylemSprite) => void;
	_type: string;
	_collision?: ((entity: any, other: any, globals?: any) => void) | undefined;
	_destroy?: ((globals?: any) => void) | undefined;
	name?: string | undefined;
	tag?: Set<string> | undefined;
	images?: string[] | undefined;
	spriteIndex: number = 0;
	sprites: Sprite[] = [];

	constructor(options: EntityOptions) {
		super();
		this._type = 'Sprite';
		this.images = options.images;
		this.mesh = this.createMesh(options.size);
		this.bodyDescription = this.createBodyDescription();
		this._update = options.update;
		this._setup = options.setup;
	}

	setup() {
		this._setup(this);
	}

	update(delta: number, { inputs }: any) { }

	destroy() { }

	createBodyDescription() {
		let rigidBodyDesc = new RigidBodyDesc(RigidBodyType.Dynamic)
			.setTranslation(0, 0, 0)
			.setGravityScale(1.0)
			.setCanSleep(false)
			.setCcdEnabled(false);

		return rigidBodyDesc;
	}

	createMesh(vector3: Vector3 | undefined = new Vector3(1, 1, 1)) {
		this.createSpritesFromImages();

		const geometry = new BoxGeometry(1, 1, 1);
		// TODO: attach to scene directly mesh is probably suboptimal
		const material2 = new MeshStandardMaterial({
			transparent: true,
			opacity: 0,
		});
		this.mesh = new Mesh(geometry, material2);
		this.sprites.forEach((sprite, index) => {
			if (this.spriteIndex === index) {
				sprite.visible = true;
			} else {
				sprite.visible = false;
			}
			this.mesh.add(sprite);
		});
		this.mesh.position.set(0, 0, 0);
		return this.mesh;
	}

	createSpritesFromImages() {
		const textureLoader = new TextureLoader();
		this.images?.forEach((image) => {
			const spriteMap = textureLoader.load('assets/' + image);
			const material = new SpriteMaterial({
				map: spriteMap,
			});
			const sprite = new Sprite(material);
			sprite.position.normalize();
			this.sprites.push(sprite);
		});
	}

	createCollider(isSensor: boolean = false) {
		const size = new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		colliderDesc.setSensor(isSensor);
		if (isSensor) {
			// "KINEMATIC_FIXED" will only sense actors moving through the sensor
			colliderDesc.activeCollisionTypes = ActiveCollisionTypes.KINEMATIC_FIXED;
			// colliderDesc.setActiveHooks(RAPIER.ActiveHooks.FILTER_INTERSECTION_PAIRS);
		}
		return colliderDesc;
	}
}