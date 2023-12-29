import { EntityOptions, GameEntity } from "../../interfaces/Entity";
import { RigidBody, RigidBodyDesc, ColliderDesc, RigidBodyType, ActiveCollisionTypes } from "@dimforge/rapier3d-compat";
import { Vector3, TextureLoader, SpriteMaterial, Sprite, Texture, Group } from "three";

// TODO: make these classes more composable

type SpriteImage = string | { name: string, file: string };

export class ZylemSprite implements GameEntity<ZylemSprite> {
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
	_spriteMap: Map<string, number> = new Map();
	group: Group;

	size: Vector3 = new Vector3(1, 1, 1);

	constructor(options: EntityOptions) {
		this._type = 'Sprite';
		this.images = options.images;
		this.group = new Group();
		this.createSprites(options.size);
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

	createSprites(size: Vector3 | undefined = new Vector3(1, 1, 1)) {
		this.createSpritesFromImages();
		this.size = size;
		this.sprites.forEach((sprite, index) => {
			if (this.spriteIndex === index) {
				sprite.visible = true;
			} else {
				sprite.visible = false;
			}
			sprite.scale.set(size.x, size.y, size.z);
			this.group.add(sprite);
		});
		this.group.position.set(0, 0, 0);
	}

	createSpritesFromImages() {
		const textureLoader = new TextureLoader();
		this.images?.forEach((image: SpriteImage, index) => {
			const file = typeof image === 'string' ? image : image.file;
			const name = typeof image === 'string' ? `${index}` : image.name;
			const spriteMap: Texture = textureLoader.load(file);
			const material = new SpriteMaterial({
				map: spriteMap,
				transparent: true,
			});
			const sprite = new Sprite(material);
			sprite.position.normalize();
			this.sprites.push(sprite);
			this._spriteMap.set(name, index);
		});
	}

	createCollider(isSensor: boolean = false) {
		const { x, y, z } = this.size;
		const size = new Vector3(x, y, z);
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

	setSprite(index: number | string) {
		let useIndex;
		const isStrVal = (typeof index === 'string');
		if (isStrVal) {
			useIndex = this._spriteMap.get(index);
		}
		if (useIndex === undefined && isStrVal) {
			useIndex = this.images?.indexOf(index);
		}
		if (!isStrVal) {
			useIndex = index;
		}
		this.spriteIndex = Math.max(useIndex ?? 0, 0);
		this.sprites.forEach((sprite, i) => {
			if (this.spriteIndex === i) {
				sprite.visible = true;
			} else {
				sprite.visible = false;
			}
		});
	}

	setAnimation(animation: string) {
		// TODO: implement animation
		// const index = this.images?.indexOf(animation) || 0;
		// this.setSprite(index);
	}
}