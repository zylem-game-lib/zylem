import { GameEntity, GameEntityOptions } from '../entity';
import { MeshStandardMaterial, MeshBasicMaterial, MeshPhongMaterial } from 'three';
import debugVertexShader from "../graphics/shaders/vertex/debug.glsl";
import debugFragmentShader from "../graphics/shaders/fragment/debug.glsl";


// export abstract class DebugInfoBuilder {
// 	abstract buildInfo(options: GameEntityOptions, entity?: GameEntity<any>): Record<string, string>;
// }

// export class DefaultDebugInfoBuilder extends DebugInfoBuilder {
// 	buildInfo(options: GameEntityOptions, entity?: GameEntity<any>): Record<string, string> {
// 		if (!entity) {
// 			return {
// 				name: 'n/a',
// 				position: 'n/a',
// 				message: 'default debug info'
// 			};
// 		}
// 		const axesHelper = new AxesHelper(2);

// 		if (entity.group) {
// 			entity.group.add(axesHelper);
// 		} else {
// 			entity.mesh?.add(axesHelper);
// 		}

// 		const delegate = new DebugDelegate(entity);
// 		return delegate.buildDebugInfo();
// 	}
// }

// const material = new ShaderMaterial({
// 	uniforms: {
// 		baseColor: { value: new Color(0x555555) },
// 		wireframeColor: { value: new Color(0x90EE90) },
// 		wireframeThickness: { value: 1.0 }
// 	},
// 	vertexShader: debugVertexShader,
// 	fragmentShader: debugFragmentShader
// });
// this.entity.debugMaterial = material;
/**
 * Interface for entities that provide custom debug information
 */
export interface DebugInfoProvider {
	getDebugInfo(): Record<string, any>;
}

/**
 * Helper to check if an object implements DebugInfoProvider
 */
export function hasDebugInfo(obj: any): obj is DebugInfoProvider {
	return obj && typeof obj.getDebugInfo === 'function';
}

/**
 * Debug delegate that provides debug information for entities
 */
export class DebugDelegate {
	private entity: GameEntity<any>;

	constructor(entity: GameEntity<any>) {
		this.entity = entity;
	}

	/**
	 * Get formatted position string
	 */
	private getPositionString(): string {
		if (this.entity.mesh) {
			const { x, y, z } = this.entity.mesh.position;
			return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
		}
		const { x, y, z } = this.entity.options.position || { x: 0, y: 0, z: 0 };
		return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
	}

	/**
	 * Get formatted rotation string (in degrees)
	 */
	private getRotationString(): string {
		if (this.entity.mesh) {
			const { x, y, z } = this.entity.mesh.rotation;
			const toDeg = (rad: number) => (rad * 180 / Math.PI).toFixed(1);
			return `${toDeg(x)}°, ${toDeg(y)}°, ${toDeg(z)}°`;
		}
		const { x, y, z } = this.entity.options.rotation || { x: 0, y: 0, z: 0 };
		const toDeg = (rad: number) => (rad * 180 / Math.PI).toFixed(1);
		return `${toDeg(x)}°, ${toDeg(y)}°, ${toDeg(z)}°`;
	}

	/**
	 * Get material information
	 */
	private getMaterialInfo(): Record<string, any> {
		if (!this.entity.mesh || !this.entity.mesh.material) {
			return { type: 'none' };
		}

		const material = Array.isArray(this.entity.mesh.material)
			? this.entity.mesh.material[0]
			: this.entity.mesh.material;

		const info: Record<string, any> = {
			type: material.type
		};

		if (material instanceof MeshStandardMaterial ||
			material instanceof MeshBasicMaterial ||
			material instanceof MeshPhongMaterial) {
			info.color = `#${material.color.getHexString()}`;
			info.opacity = material.opacity;
			info.transparent = material.transparent;
		}

		if ('roughness' in material) {
			info.roughness = material.roughness;
		}

		if ('metalness' in material) {
			info.metalness = material.metalness;
		}

		return info;
	}

	private getPhysicsInfo(): Record<string, any> | null {
		if (!this.entity.body) {
			return null;
		}

		const info: Record<string, any> = {
			type: this.entity.body.bodyType(),
			mass: this.entity.body.mass(),
			isEnabled: this.entity.body.isEnabled(),
			isSleeping: this.entity.body.isSleeping()
		};

		const velocity = this.entity.body.linvel();
		info.velocity = `${velocity.x.toFixed(2)}, ${velocity.y.toFixed(2)}, ${velocity.z.toFixed(2)}`;

		return info;
	}

	public buildDebugInfo(): Record<string, any> {
		const defaultInfo: Record<string, any> = {
			name: this.entity.name || this.entity.uuid,
			uuid: this.entity.uuid,
			position: this.getPositionString(),
			rotation: this.getRotationString(),
			material: this.getMaterialInfo()
		};

		const physicsInfo = this.getPhysicsInfo();
		if (physicsInfo) {
			defaultInfo.physics = physicsInfo;
		}

		if (this.entity.behaviors.length > 0) {
			defaultInfo.behaviors = this.entity.behaviors.map(b => b.constructor.name);
		}

		if (hasDebugInfo(this.entity)) {
			const customInfo = this.entity.getDebugInfo();
			return { ...defaultInfo, ...customInfo };
		}

		return defaultInfo;
	}
}

export class EnhancedDebugInfoBuilder {
	private customBuilder?: (options: GameEntityOptions) => Record<string, any>;

	constructor(customBuilder?: (options: GameEntityOptions) => Record<string, any>) {
		this.customBuilder = customBuilder;
	}

	buildInfo(options: GameEntityOptions, entity?: GameEntity<any>): Record<string, any> {
		if (this.customBuilder) {
			return this.customBuilder(options);
		}

		if (entity) {
			const delegate = new DebugDelegate(entity);
			return delegate.buildDebugInfo();
		}

		const { x, y, z } = options.position || { x: 0, y: 0, z: 0 };
		return {
			name: (options as any).name || 'unnamed',
			position: `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`
		};
	}
}
