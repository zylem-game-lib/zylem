import { EntityOptions, GameEntity } from "../../interfaces/Entity";
import { RigidBody, RigidBodyDesc, ColliderDesc, RigidBodyType, ActiveCollisionTypes } from "@dimforge/rapier3d-compat";
import { Vector3, TextureLoader, SpriteMaterial, Sprite, Texture, Group, Vector2 } from "three";

// TODO: make these classes more composable

export type SpriteImage = { name: string, file: string };
export type SpriteAnimation<T extends SpriteImage[] | undefined> = {
	name: string;
	frames: T extends SpriteImage[] ? Array<T[number]['name']> : never[];
	speed: number | number[];
	loop: boolean;
};

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

	images?: SpriteImage[] | undefined;
	spriteIndex: number = 0;
	sprites: Sprite[] = [];
	_spriteMap: Map<string, number> = new Map();
	group: Group;
	animations?: SpriteAnimation<typeof this.images>[] | undefined;
	// TODO: create proper types for internal animations
	_animations: Map<string, any> = new Map();
	_currentAnimation: any = null;
	_currentAnimationFrame: string = '';
	_currentAnimationIndex: number = 0;
	_currentAnimationTime: number = 0;

	size: Vector3 = new Vector3(1, 1, 1);
	collisionSize: Vector3 | null = null;

	constructor(options: EntityOptions) {
		this._type = 'Sprite';
		this.images = options.images;
		this.animations = options.animations;
		this.collisionSize = options.collisionSize ?? this.collisionSize;
		this.group = new Group();
		this.createSprites(options.size);
		this.createAnimations();
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
			// .setAdditionalMass(1)
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

			image = typeof image === 'string' ? { name: `${index}`, file: image } : image;

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

	createAnimations() {
		this.animations?.forEach((animation, index) => {
			const { name = "anim-1", loop = false, frames, speed = 1 } = animation;
			const internalAnimation = {
				frames: frames.flatMap((frame: string, index: number) => {
					return {
						key: frame,
						index,
						// TODO: needs to be array based
						time: speed as number * (index + 1),
						duration: speed
					}
				}),
				loop,
			}
			this._animations.set(name, internalAnimation);
		});
	}

	createCollider(isSensor: boolean = false) {
		const { x, y, z } = this.collisionSize ?? this.size;
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

	setSprite(key: string) {
		const spriteIndex = this._spriteMap.get(key);
		const useIndex = spriteIndex ?? 0;

		this.spriteIndex = useIndex;

		// TODO: consider using generator
		this.sprites.forEach((sprite, i) => {
			if (this.spriteIndex === i) {
				sprite.visible = true;
			} else {
				sprite.visible = false;
			}
		});
	}

	setAnimation(name: string, delta: number) {
		const animation = this._animations.get(name);
		const { loop, frames } = animation;
		const frame = frames[this._currentAnimationIndex]
		if (name === this._currentAnimation) {
			this._currentAnimationFrame = frame.key;
			this._currentAnimationTime += delta;
			this.setSprite(this._currentAnimationFrame);
		} else {
			this._currentAnimation = name;
		}

		if (this._currentAnimationTime > frame.time) {
			this._currentAnimationIndex++;
		}

		if (this._currentAnimationIndex >= frames.length) {
			if (loop) {
				this._currentAnimationIndex = 0;
				this._currentAnimationTime = 0;
			} else {
				this._currentAnimationTime = frames[this._currentAnimationIndex].time
			}
		}
	}
}