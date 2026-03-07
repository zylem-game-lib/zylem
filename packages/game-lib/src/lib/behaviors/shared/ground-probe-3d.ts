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

	detect(entity: GroundProbeEntity, options: GroundProbeOptions): boolean {
		if (!this.world?.world || !entity.body) return false;

		const offsets = options.offsets ?? DEFAULT_OFFSETS;
		const translation = entity.body.translation();
		const rays = this.getOrCreateRays(entity.uuid, offsets.length);
		const hits = new Array<boolean>(offsets.length).fill(false);
		const originYOffset = options.originYOffset ?? 0;

		for (let index = 0; index < offsets.length; index++) {
			const offset = offsets[index];
			const ray = rays[index];

			ray.origin = {
				x: translation.x + offset.x,
				y: translation.y + originYOffset,
				z: translation.z + offset.z,
			};
			ray.dir = { x: 0, y: -1, z: 0 };

			this.world.world.castRay(
				ray,
				options.rayLength,
				true,
				undefined,
				undefined,
				undefined,
				undefined,
				(collider: any) => {
					const ref = collider._parent?.userData?.uuid;
					if (ref === entity.uuid) return false;
					hits[index] = true;
					return true;
				},
			);
		}

		const grounded =
			(options.mode ?? 'any') === 'center'
				? (hits[0] ?? false)
				: hits.some(Boolean);

		if (options.debug && options.scene) {
			this.updateDebugLines(
				entity.uuid,
				rays,
				grounded,
				options.rayLength,
				options.scene,
			);
		} else {
			this.disposeDebugLines(entity.uuid);
		}

		return grounded;
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
