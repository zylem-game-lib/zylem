import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { Vector3 } from 'three';
import {
	TextureLoader,
	SpriteMaterial,
	Sprite as ThreeSprite,
} from 'three';
import { ZylemBlueColor } from '../core/utility';
import { BaseNode } from '../core/base-node';
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, EntityOptions, GameEntity } from './entity';
import { createEntity } from './create';

export type SpriteImage = { name: string; file: string };
export type SpriteAnimation = {
	name: string;
	frames: string[];
	speed: number | number[];
	loop: boolean;
};

type ZylemSpriteOptions = EntityOptions & {
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
		color: ZylemBlueColor,
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

export class SpriteMeshBuilder extends EntityMeshBuilder {
	buildGeometry(options: ZylemSpriteOptions): any {
		return null;
	}
	postBuild(mesh: any): any {
		return mesh;
	}
}

export class SpriteBuilder extends EntityBuilder<ZylemSprite, ZylemSpriteOptions> {
	constructor(options: Partial<ZylemSpriteOptions>, meshBuilder: EntityMeshBuilder, collisionBuilder: EntityCollisionBuilder) {
		super(options, meshBuilder, collisionBuilder);
	}

	protected createEntity(options: Partial<ZylemSpriteOptions>): ZylemSprite {
		return new ZylemSprite(options);
	}
}

export const SPRITE_TYPE = Symbol('Sprite');

export class ZylemSprite extends GameEntity<ZylemSpriteOptions> {
	static type = SPRITE_TYPE;

	private sprites: ThreeSprite[] = [];
	private spriteMap: Map<string, number> = new Map();
	private currentSpriteIndex: number = 0;
	private animations: Map<string, any> = new Map();
	private currentAnimation: any = null;
	private currentAnimationFrame: string = '';
	private currentAnimationIndex: number = 0;
	private currentAnimationTime: number = 0;

	constructor(options?: ZylemSpriteOptions) {
		super();
		this.options = { ...spriteDefaults, ...options };
		this.createSpritesFromImages(options?.images || []);
		this.createAnimations(options?.animations || []);
	}

	private createSpritesFromImages(images: SpriteImage[]) {
		const textureLoader = new TextureLoader();
		images.forEach((image, index) => {
			const spriteMap = textureLoader.load(image.file);
			const material = new SpriteMaterial({
				map: spriteMap,
				transparent: true,
			});
			const sprite = new ThreeSprite(material);
			sprite.position.normalize();
			this.sprites.push(sprite);
			this.spriteMap.set(image.name, index);
		});
	}

	private createAnimations(animations: SpriteAnimation[]) {
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
		this.sprites.forEach((sprite, i) => {
			sprite.visible = this.currentSpriteIndex === i;
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

}

type SpriteOptions = BaseNode | ZylemSpriteOptions;

export async function sprite(...args: Array<SpriteOptions>): Promise<ZylemSprite> {
	return createEntity<ZylemSprite, ZylemSpriteOptions>({
		args,
		defaultConfig: spriteDefaults,
		BuilderClass: SpriteBuilder,
		CollisionBuilderClass: SpriteCollisionBuilder,
		entityType: ZylemSprite.type
	});
}