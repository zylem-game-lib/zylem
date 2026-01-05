import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Color, Euler, Group, Quaternion, Vector3 } from 'three';
import {
	TextureLoader,
	SpriteMaterial,
	Sprite as ThreeSprite,
} from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { createEntity } from './create';
import { DestroyContext, DestroyFunction, UpdateContext, UpdateFunction } from '../core/base-node-life-cycle';
import { DebugDelegate } from './delegates/debug';

export type SpriteImage = { name: string; file: string };
export type SpriteAnimation = {
	name: string;
	frames: string[];
	speed: number | number[];
	loop: boolean;
};

type ZylemSpriteOptions = GameEntityOptions & {
	images?: SpriteImage[];
	animations?: SpriteAnimation[];
	size?: Vector3;
	collisionSize?: Vector3;
};

const spriteDefaults: ZylemSpriteOptions = {
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
	collision: {
		static: false,
	},
	material: {
		color: new Color('#ffffff'),
		shader: 'standard'
	},
	images: [],
	animations: [],
};

export class SpriteCollisionBuilder extends EntityCollisionBuilder {
	collider(options: ZylemSpriteOptions): ColliderDesc {
		const size = options.collisionSize || options.size || new Vector3(1, 1, 1);
		const half = { x: size.x / 2, y: size.y / 2, z: size.z / 2 };
		let colliderDesc = ColliderDesc.cuboid(half.x, half.y, half.z);
		return colliderDesc;
	}
}

export class SpriteBuilder extends EntityBuilder<ZylemSprite, ZylemSpriteOptions> {
	protected createEntity(options: Partial<ZylemSpriteOptions>): ZylemSprite {
		return new ZylemSprite(options);
	}
}

export const SPRITE_TYPE = Symbol('Sprite');

export class ZylemSprite extends GameEntity<ZylemSpriteOptions> {
	static type = SPRITE_TYPE;

	protected sprites: ThreeSprite[] = [];
	protected spriteMap: Map<string, number> = new Map();
	protected currentSpriteIndex: number = 0;
	protected animations: Map<string, any> = new Map();
	protected currentAnimation: any = null;
	protected currentAnimationFrame: string = '';
	protected currentAnimationIndex: number = 0;
	protected currentAnimationTime: number = 0;

	constructor(options?: ZylemSpriteOptions) {
		super();
		this.options = { ...spriteDefaults, ...options };
		// Add sprite-specific lifecycle callbacks (only registered once)
		this.prependUpdate(this.spriteUpdate.bind(this) as any);
		this.onDestroy(this.spriteDestroy.bind(this) as any);
	}

	public create(): this {
		// Clear previous state to prevent accumulation on reload
		this.sprites = [];
		this.spriteMap.clear();
		this.animations.clear();
		this.currentAnimation = null;
		this.currentAnimationFrame = '';
		this.currentAnimationIndex = 0;
		this.currentAnimationTime = 0;
		this.group = undefined;
		
		// Recreate sprites and animations
		this.createSpritesFromImages(this.options?.images || []);
		this.createAnimations(this.options?.animations || []);
		
		// Call parent create
		return super.create();
	}

	protected createSpritesFromImages(images: SpriteImage[]) {
		// Use synchronous load() which returns a texture that updates when ready
		// This maintains compatibility with the synchronous create() method
		const textureLoader = new TextureLoader();
		images.forEach((image, index) => {
			const spriteMap = textureLoader.load(image.file);
			const material = new SpriteMaterial({
				map: spriteMap,
				transparent: true,
			});
			const _sprite = new ThreeSprite(material);
			_sprite.position.normalize();
			this.sprites.push(_sprite);
			this.spriteMap.set(image.name, index);
		});
		this.group = new Group();
		this.group.add(...this.sprites);
	}

	protected createAnimations(animations: SpriteAnimation[]) {
		animations.forEach(animation => {
			const { name, frames, loop = false, speed = 1 } = animation;
			const internalAnimation = {
				frames: frames.map((frame, index) => ({
					key: frame,
					index,
					time: (typeof speed === 'number' ? speed : speed[index]) * (index + 1),
					duration: typeof speed === 'number' ? speed : speed[index]
				})),
				loop,
			};
			this.animations.set(name, internalAnimation);
		});
	}

	setSprite(key: string) {
		const spriteIndex = this.spriteMap.get(key);
		const useIndex = spriteIndex ?? 0;
		this.currentSpriteIndex = useIndex;
		this.sprites.forEach((_sprite, i) => {
			_sprite.visible = this.currentSpriteIndex === i;
		});
	}

	setAnimation(name: string, delta: number) {
		const animation = this.animations.get(name);
		if (!animation) return;

		const { loop, frames } = animation;
		const frame = frames[this.currentAnimationIndex];

		if (name === this.currentAnimation) {
			this.currentAnimationFrame = frame.key;
			this.currentAnimationTime += delta;
			this.setSprite(this.currentAnimationFrame);
		} else {
			this.currentAnimation = name;
		}

		if (this.currentAnimationTime > frame.time) {
			this.currentAnimationIndex++;
		}

		if (this.currentAnimationIndex >= frames.length) {
			if (loop) {
				this.currentAnimationIndex = 0;
				this.currentAnimationTime = 0;
			} else {
				this.currentAnimationTime = frames[this.currentAnimationIndex].time;
			}
		}
	}

	async spriteUpdate(params: UpdateContext<ZylemSpriteOptions>): Promise<void> {
		this.sprites.forEach(_sprite => {
			if (_sprite.material) {
				const q = this.body?.rotation();
				if (q) {
					const quat = new Quaternion(q.x, q.y, q.z, q.w);
					const euler = new Euler().setFromQuaternion(quat, 'XYZ');
					_sprite.material.rotation = euler.z;
				}
				_sprite.scale.set(this.options.size?.x ?? 1, this.options.size?.y ?? 1, this.options.size?.z ?? 1);
			}
		});
	}

	async spriteDestroy(params: DestroyContext<ZylemSpriteOptions>): Promise<void> {
		this.sprites.forEach(_sprite => {
			_sprite.removeFromParent();
		});
		this.group?.remove(...this.sprites);
		this.group?.removeFromParent();
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();
		return {
			...baseInfo,
			type: String(ZylemSprite.type),
		};
	}
}

type SpriteOptions = BaseNode | Partial<ZylemSpriteOptions>;

export async function sprite(...args: Array<SpriteOptions>): Promise<ZylemSprite> {
	return createEntity<ZylemSprite, ZylemSpriteOptions>({
		args,
		defaultConfig: spriteDefaults,
		EntityClass: ZylemSprite,
		BuilderClass: SpriteBuilder,
		CollisionBuilderClass: SpriteCollisionBuilder,
		entityType: ZylemSprite.type
	});
}