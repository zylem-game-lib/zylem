import { Quaternion, Vector3 } from 'three';
import type { CameraContext, CameraPerspective, CameraPose } from '../types';
import { Vec3Input, toThreeVector3 } from '../../core/vector';

/**
 * Configuration for the second-person perspective.
 *
 * The camera sits on another entity (`anchorKey`) and looks at the subject.
 * Nothing here reads player look input.
 */
export interface SecondPersonOptions {
	/** Key of the entity whose eyes the camera uses. Default 'anchor'. */
	anchorKey?: string;
	/** Key of the entity to look at. Default 'primary'. */
	subjectKey?: string;
	/** Height above the anchor's position. Default 1.7. */
	eyeHeight?: number;
	/** Perspective field of view. Default 75. */
	fov?: number;
	/** Fallback camera position when the anchor is missing. */
	initialPosition?: Vec3Input;
	/** Fallback lookAt point when the anchor is missing. */
	initialLookAt?: Vec3Input;
}

interface SecondPersonDefaults {
	anchorKey: string;
	subjectKey: string;
	eyeHeight: number;
	fov: number;
}

const DEFAULTS: SecondPersonDefaults = {
	anchorKey: 'anchor',
	subjectKey: 'primary',
	eyeHeight: 1.7,
	fov: 75,
};

const _forward = new Vector3();

/**
 * Second-person perspective.
 *
 * Position comes from an anchor entity. The subject, when present, is the
 * look-at; otherwise the camera looks along the anchor's forward (−Z).
 * The player's facing does not move this camera.
 */
export class SecondPersonPerspective implements CameraPerspective {
	readonly id = 'second-person';
	readonly projection = 'perspective' as const;
	readonly defaults = { damping: 1 };

	private opts: SecondPersonDefaults;
	private initialPosition?: Vector3;
	private initialLookAt?: Vector3;

	constructor(options?: SecondPersonOptions) {
		const { initialPosition, initialLookAt, ...rest } = options ?? {};
		this.opts = { ...DEFAULTS, ...rest };
		this.initialPosition = initialPosition ? toThreeVector3(initialPosition) : undefined;
		this.initialLookAt = initialLookAt ? toThreeVector3(initialLookAt) : undefined;
	}

	getBasePose(ctx: CameraContext): CameraPose {
		const anchor = ctx.targets[this.opts.anchorKey];
		if (!anchor) return this.staticPose();

		const position = new Vector3(
			anchor.position.x,
			anchor.position.y + this.opts.eyeHeight,
			anchor.position.z,
		);
		const subject = ctx.targets[this.opts.subjectKey];
		const lookAt = subject
			? subject.position.clone()
			: position.clone().add(this.anchorForward(anchor.rotation));

		return {
			position,
			rotation: new Quaternion(),
			fov: this.opts.fov,
			near: 0.1,
			far: 1000,
			lookAt,
		};
	}

	private staticPose(): CameraPose {
		const position = this.initialPosition?.clone() ?? new Vector3(0, this.opts.eyeHeight, 0);
		const lookAt = this.initialLookAt?.clone() ?? position.clone().add(new Vector3(0, 0, -1));
		return {
			position,
			rotation: new Quaternion(),
			fov: this.opts.fov,
			near: 0.1,
			far: 1000,
			lookAt,
		};
	}

	/** Anchor forward in world space. Three.js objects look down −Z. */
	private anchorForward(rotation: Quaternion | undefined): Vector3 {
		_forward.set(0, 0, -1);
		if (rotation) _forward.applyQuaternion(rotation);
		return _forward.clone();
	}
}
