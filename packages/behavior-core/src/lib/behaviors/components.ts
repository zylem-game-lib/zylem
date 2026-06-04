/**
 * Core behavior helper types
 *
 * Plain data interfaces shared by movement behaviors and coordinators.
 */

import type { RigidBody } from '@dimforge/rapier3d-compat';
import { Vector3, Quaternion } from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// TransformComponent (render-facing)
// Written only by PhysicsSyncBehavior, read by rendering/animation
// ─────────────────────────────────────────────────────────────────────────────

export interface TransformComponent {
	position: Vector3;
	rotation: Quaternion;
}

export function createTransformComponent(): TransformComponent {
	return {
		position: new Vector3(),
		rotation: new Quaternion(),
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// PhysicsBodyComponent (bridge to Rapier, not state)
// ECS does not store velocity, mass, etc. - Rapier owns all physical truth
// ─────────────────────────────────────────────────────────────────────────────

export interface PhysicsBodyComponent {
	body: RigidBody;
}

export function createPhysicsBodyComponent(body: RigidBody): PhysicsBodyComponent {
	return { body };
}
