import { Ray } from '@dimforge/rapier3d-compat';
import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from 'three';

export interface GroundProbeOffset {
	x: number;
	z: number;
}

export type GroundProbeMode = 'center' | 'any';

export interface GroundProbeEntity {
	uuid: string;
	body: any;
}

export interface GroundProbeOptions {
	rayLength: number;
	offsets?: readonly GroundProbeOffset[];
	mode?: GroundProbeMode;
	debug?: boolean;
	scene?: any;
	originYOffset?: number;
}

export interface GroundProbeSupportHit {
	toi: number;
	point: {
		x: number;
		y: number;
		z: number;
	};
	origin: {
		x: number;
		y: number;
		z: number;
	};
	rayIndex: number;
	colliderUuid?: string;
}

export const GROUND_SNAP_EPSILON = 0.001;

const DEFAULT_OFFSETS: readonly GroundProbeOffset[] = [
	{ x: 0, z: 0 },
	{ x: 0.4, z: 0.4 },
	{ x: -0.4, z: 0.4 },
	{ x: 0.4, z: -0.4 },
	{ x: -0.4, z: -0.4 },
] as const;

export class GroundProbe3D {
	private rays = new Map<string, Ray[]>();
	private debugLines = new Map<string, Line[]>();

	constructor(private world: any) {}

	probeSupport(
		entity: GroundProbeEntity,
		options: GroundProbeOptions,
	): GroundProbeSupportHit | null {
		if (!this.world?.world || !entity.body) return null;

		const mode = options.mode ?? 'any';
		const offsets =
			mode === 'center'
				? (options.offsets ?? DEFAULT_OFFSETS).slice(0, 1)
				: (options.offsets ?? DEFAULT_OFFSETS);
		const translation = entity.body.translation();
		const rays = this.getOrCreateRays(entity.uuid, offsets.length);
		const originYOffset = options.originYOffset ?? 0;
		let support: GroundProbeSupportHit | null = null;

		for (let index = 0; index < offsets.length; index++) {
			const offset = offsets[index];
			const ray = rays[index];

			ray.origin = {
				x: translation.x + offset.x,
				y: translation.y + originYOffset,
				z: translation.z + offset.z,
			};
			ray.dir = { x: 0, y: -1, z: 0 };

			const hit = this.world.world.castRay(
				ray,
				options.rayLength,
				true,
				undefined,
				undefined,
				undefined,
				entity.body,
			);
			if (!hit) continue;

			const nextSupport: GroundProbeSupportHit = {
				toi: hit.toi,
				point: {
					x: ray.origin.x + ray.dir.x * hit.toi,
					y: ray.origin.y + ray.dir.y * hit.toi,
					z: ray.origin.z + ray.dir.z * hit.toi,
				},
				origin: {
					x: ray.origin.x,
					y: ray.origin.y,
					z: ray.origin.z,
				},
				rayIndex: index,
				colliderUuid: hit.collider?._parent?.userData?.uuid,
			};

			if (mode === 'center') {
				support = nextSupport;
				break;
			}

			if (!support || nextSupport.toi < support.toi) {
				support = nextSupport;
			}
		}

		if (options.debug && options.scene) {
			this.updateDebugLines(
				entity.uuid,
				rays,
				Boolean(support),
				options.rayLength,
				options.scene,
			);
		} else {
			this.disposeDebugLines(entity.uuid);
		}

		return support;
	}

	detect(entity: GroundProbeEntity, options: GroundProbeOptions): boolean {
		return this.probeSupport(entity, options) != null;
	}

	destroyEntity(uuid: string): void {
		this.rays.delete(uuid);
		this.disposeDebugLines(uuid);
	}

	destroy(): void {
		this.rays.clear();
		for (const uuid of this.debugLines.keys()) {
			this.disposeDebugLines(uuid);
		}
		this.debugLines.clear();
	}

	private getOrCreateRays(uuid: string, count: number): Ray[] {
		let rays = this.rays.get(uuid);
		if (!rays || rays.length !== count) {
			rays = Array.from(
				{ length: count },
				() => new Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
			);
			this.rays.set(uuid, rays);
		}
		return rays;
	}

	private updateDebugLines(
		uuid: string,
		rays: Ray[],
		hasGround: boolean,
		length: number,
		scene: any,
	): void {
		let lines = this.debugLines.get(uuid);
		if (!lines) {
			lines = rays.map(() => {
				const geometry = new BufferGeometry().setFromPoints([
					new Vector3(),
					new Vector3(),
				]);
				const material = new LineBasicMaterial({ color: 0xff0000 });
				const line = new Line(geometry, material);
				scene.add(line);
				return line;
			});
			this.debugLines.set(uuid, lines);
		}

		rays.forEach((ray, index) => {
			const line = lines![index];
			const start = new Vector3(ray.origin.x, ray.origin.y, ray.origin.z);
			const end = new Vector3(
				ray.origin.x + ray.dir.x * length,
				ray.origin.y + ray.dir.y * length,
				ray.origin.z + ray.dir.z * length,
			);
			line.visible = true;
			line.geometry.setFromPoints([start, end]);
			(line.material as LineBasicMaterial).color.setHex(
				hasGround ? 0x00ff00 : 0xff0000,
			);
		});
	}

	private disposeDebugLines(uuid: string): void {
		const lines = this.debugLines.get(uuid);
		if (!lines) return;

		for (const line of lines) {
			line.removeFromParent();
			line.geometry.dispose();
			(line.material as LineBasicMaterial).dispose();
		}

		this.debugLines.delete(uuid);
	}
}

export function getGroundAnchorOffsetY(entity: any): number {
	if ((entity as any)?.controlledRotation) {
		return 0;
	}

	const collisionSize =
		entity?.options?.collision?.size ??
		entity?.options?.collisionSize ??
		entity?.options?.size;
	const height = collisionSize?.y ?? 0;
	return height > 0 ? height / 2 : 0;
}

export function getGroundSnapTargetY(
	entity: any,
	support: GroundProbeSupportHit,
	epsilon: number = GROUND_SNAP_EPSILON,
): number {
	return support.point.y + getGroundAnchorOffsetY(entity) + epsilon;
}
