import {
	Vector3,
	TextureLoader,
	SpriteMaterial,
	Sprite as ThreeSprite,
	Texture,
	Color,
	BufferGeometry,
	MeshPhongMaterial,
	Mesh,
} from "three";
import { applyMixins } from "../core/composable";
import { ZylemMaterial } from "../core/material";
import { GameEntity } from "../core/game-entity";
import { LifecycleParameters, UpdateParameters } from "../core/entity";
import { SpriteCollision } from "../collision/collision";
import { Moveable } from "../behaviors/moveable";
import { ZylemBlueColor } from "../interfaces/utility";
import { GameEntityOptions } from "../interfaces/entity";

export type SpriteImage = { name: string, file: string };
export type SpriteAnimation<T extends SpriteImage[] | undefined> = {
	name: string;
	frames: T extends SpriteImage[] ? Array<T[number]['name']> : never[];
	speed: number | number[];
	loop: boolean;
};

type ZylemSpriteOptions = GameEntityOptions<ZylemSprite> & {
	static?: boolean;
	color?: Color;
	images?: SpriteImage[] | undefined;
	animations?: SpriteAnimation<any>[] | undefined;
	size?: Vector3;
	collisionSize?: Vector3;
}

export class ZylemSprite extends GameEntity<ZylemSprite> {
	protected type = 'Sprite';
	_static: boolean = false;
	_sensor: boolean = false;

	_images?: SpriteImage[] | undefined;
	spriteIndex: number = 0;
	sprites: ThreeSprite[] = [];
	_spriteMap: Map<string, number> = new Map();

	_animations?: SpriteAnimation<typeof this._images>[] | undefined;
	_mappedAnimations: Map<string, any> = new Map(); // TODO: create proper types for internal animations
	_currentAnimation: any = null;
	_currentAnimationFrame: string = '';
	_currentAnimationIndex: number = 0;
	_currentAnimationTime: number = 0;

	constructor(options: ZylemSpriteOptions) {
		const bluePrint = options;
		super(bluePrint);
		this._static = bluePrint.static ?? false;
		this._color = bluePrint.color ?? ZylemBlueColor;
		this._size = bluePrint.size ?? new Vector3(1, 1, 1);
		this._images = bluePrint.images ?? [];
		this._animations = bluePrint.animations ?? [];

	}

	public createFromBlueprint(): this {
		this.createSprites(this._size);
		this.createAnimations();
		this.createCollision({ isDynamicBody: !this._static, isSensor: this._sensor });
		return this;
	}

	public setup(params: LifecycleParameters<ZylemSprite>) {
		super.setup({ ...params, entity: this });
		this._setup({ ...params, entity: this });
	}

	public update(params: UpdateParameters<ZylemSprite>): void {
		super.update({ ...params, entity: this });
		this._update({ ...params, entity: this });
	}

	public destroy(params: LifecycleParameters<ZylemSprite>): void {
		super.destroy({ ...params, entity: this });
		this._destroy({ ...params, entity: this });
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
		this._images?.forEach((image: SpriteImage, index: number) => {
			const file = typeof image === 'string' ? image : image.file;
			const name = typeof image === 'string' ? `${index}` : image.name;

			image = typeof image === 'string' ? { name: `${index}`, file: image } : image;

			const spriteMap: Texture = textureLoader.load(file);
			const material = new SpriteMaterial({
				map: spriteMap,
				transparent: true,
			});
			const sprite = new ThreeSprite(material);
			sprite.position.normalize();
			this.sprites.push(sprite);
			this._spriteMap.set(name, index);
		});
	}

	createAnimations() {
		this._animations?.forEach((animation, index) => {
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
			this._mappedAnimations.set(name, internalAnimation);
		});
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
		const animation = this._mappedAnimations.get(name);
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

	createDebugMesh(geometry: BufferGeometry) {
		const color = this.debugColor;
		const debugMaterial = new MeshPhongMaterial({ color });
		debugMaterial.wireframe = true;
		debugMaterial.needsUpdate = true;
		this._debugMesh = new Mesh(geometry, debugMaterial);
	}
}

class _Sprite { };

export interface ZylemSprite extends ZylemMaterial, SpriteCollision, Moveable, _Sprite { };

export function Sprite(options: ZylemSpriteOptions): ZylemSprite {
	applyMixins(ZylemSprite, [ZylemMaterial, SpriteCollision, Moveable, _Sprite]);

	return new ZylemSprite(options) as ZylemSprite;
}