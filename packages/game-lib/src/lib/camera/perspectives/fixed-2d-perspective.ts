import { Vector3, Quaternion } from 'three';
import type { CameraPerspective, CameraContext, CameraPose } from '../types';

/**
 * Configuration for the fixed 2D perspective.
 */
export interface Fixed2DOptions {
	/** Fixed camera position. Default (0, 0, 10). */
	position?: { x: number; y: number; z: number };
	/** Orthographic zoom (frustum size). Default 10. */
	zoom?: number;
}

const DEFAULTS: Required<Fixed2DOptions> = {
	position: { x: 0, y: 0, z: 10 },
	zoom: 10,
};

/**
 * Fixed 2D perspective.
 *
 * Returns a static orthographic pose looking down the Z-axis.
 * No target following -- the camera stays at the configured position.
 */
export class Fixed2DPerspective implements CameraPerspective {
	readonly id = 'fixed-2d';
	readonly defaults = { damping: 1 };

	private opts: Required<Fixed2DOptions>;

	constructor(options?: Fixed2DOptions) {
		this.opts = { ...DEFAULTS, ...options };
	}

	getBasePose(_ctx: CameraContext): CameraPose {
		return {
			position: new Vector3(
				this.opts.position.x,
				this.opts.position.y,
				this.opts.position.z
			),
			rotation: new Quaternion(),
			zoom: this.opts.zoom,
			near: 1,
			far: 1000,
			lookAt: new Vector3(this.opts.position.x, this.opts.position.y, 0),
		};
	}
}
