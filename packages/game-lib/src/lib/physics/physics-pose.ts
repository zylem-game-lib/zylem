import { Quaternion } from 'three';

export interface PhysicsVector3 {
	x: number;
	y: number;
	z: number;
}

export interface PhysicsQuaternion {
	x: number;
	y: number;
	z: number;
	w: number;
}

export interface PhysicsPose {
	position: PhysicsVector3;
	rotation: PhysicsQuaternion;
}

export interface PhysicsPoseHistory {
	previous: PhysicsPose;
	current: PhysicsPose;
}

export interface PhysicsPoseReadable {
	translation(): PhysicsVector3;
	rotation(): PhysicsQuaternion;
}

export interface PhysicsRenderPoseProvider {
	getPoseHistory(): PhysicsPoseHistory;
	getRenderPose(alpha: number): PhysicsPose;
}

const directBodyPoseHistory = new WeakMap<object, PhysicsPoseHistory>();
const _previousQuaternion = new Quaternion();
const _currentQuaternion = new Quaternion();
const _renderQuaternion = new Quaternion();

export function createPhysicsPose(
	position: Partial<PhysicsVector3> = {},
	rotation: Partial<PhysicsQuaternion> = {},
): PhysicsPose {
	return {
		position: {
			x: position.x ?? 0,
			y: position.y ?? 0,
			z: position.z ?? 0,
		},
		rotation: {
			x: rotation.x ?? 0,
			y: rotation.y ?? 0,
			z: rotation.z ?? 0,
			w: rotation.w ?? 1,
		},
	};
}

export function clonePhysicsVector3(vector: PhysicsVector3): PhysicsVector3 {
	return { x: vector.x, y: vector.y, z: vector.z };
}

export function clonePhysicsQuaternion(
	rotation: PhysicsQuaternion,
): PhysicsQuaternion {
	return { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w };
}

export function clonePhysicsPose(pose: PhysicsPose): PhysicsPose {
	return {
		position: clonePhysicsVector3(pose.position),
		rotation: clonePhysicsQuaternion(pose.rotation),
	};
}

export function clampInterpolationAlpha(alpha: number): number {
	if (!Number.isFinite(alpha)) return 0;
	return Math.max(0, Math.min(1, alpha));
}

export function capturePhysicsPose(body: PhysicsPoseReadable): PhysicsPose {
	return {
		position: clonePhysicsVector3(body.translation()),
		rotation: clonePhysicsQuaternion(body.rotation()),
	};
}

export function createCollapsedPhysicsPoseHistory(
	pose: PhysicsPose,
): PhysicsPoseHistory {
	const current = clonePhysicsPose(pose);
	return {
		previous: clonePhysicsPose(current),
		current,
	};
}

export function registerDirectBodyPoseHistory(
	body: object & PhysicsPoseReadable,
): PhysicsPoseHistory {
	const history = createCollapsedPhysicsPoseHistory(capturePhysicsPose(body));
	directBodyPoseHistory.set(body, history);
	return history;
}

export function getDirectBodyPoseHistory(
	body: object,
): PhysicsPoseHistory | null {
	return directBodyPoseHistory.get(body) ?? null;
}

export function collapseDirectBodyPoseHistory(
	body: object & PhysicsPoseReadable,
): PhysicsPoseHistory {
	const pose = capturePhysicsPose(body);
	const history =
		directBodyPoseHistory.get(body) ?? createCollapsedPhysicsPoseHistory(pose);

	history.previous = clonePhysicsPose(pose);
	history.current = clonePhysicsPose(pose);
	directBodyPoseHistory.set(body, history);

	return history;
}

export function prepareDirectBodyPoseHistoryStep(
	body: object & PhysicsPoseReadable,
): PhysicsPoseHistory {
	return collapseDirectBodyPoseHistory(body);
}

export function commitDirectBodyPoseHistoryStep(
	body: object & PhysicsPoseReadable,
): PhysicsPoseHistory {
	const pose = capturePhysicsPose(body);
	const history =
		directBodyPoseHistory.get(body) ?? createCollapsedPhysicsPoseHistory(pose);

	history.current = clonePhysicsPose(pose);
	directBodyPoseHistory.set(body, history);

	return history;
}

export function interpolatePhysicsPose(
	previous: PhysicsPose,
	current: PhysicsPose,
	alpha: number,
): PhysicsPose {
	const t = clampInterpolationAlpha(alpha);

	_previousQuaternion.set(
		previous.rotation.x,
		previous.rotation.y,
		previous.rotation.z,
		previous.rotation.w,
	);
	_currentQuaternion.set(
		current.rotation.x,
		current.rotation.y,
		current.rotation.z,
		current.rotation.w,
	);
	_renderQuaternion.slerpQuaternions(
		_previousQuaternion,
		_currentQuaternion,
		t,
	);

	return {
		position: {
			x: previous.position.x + (current.position.x - previous.position.x) * t,
			y: previous.position.y + (current.position.y - previous.position.y) * t,
			z: previous.position.z + (current.position.z - previous.position.z) * t,
		},
		rotation: {
			x: _renderQuaternion.x,
			y: _renderQuaternion.y,
			z: _renderQuaternion.z,
			w: _renderQuaternion.w,
		},
	};
}

export function getBodyPoseHistory(body: unknown): PhysicsPoseHistory | null {
	if (isRenderPoseProvider(body)) {
		return body.getPoseHistory();
	}
	if (isPhysicsPoseReadable(body)) {
		return directBodyPoseHistory.get(body as object) ?? null;
	}
	return null;
}

export function getBodyRenderPose(
	body: PhysicsPoseReadable | PhysicsRenderPoseProvider,
	alpha: number,
): PhysicsPose {
	if (isRenderPoseProvider(body)) {
		return body.getRenderPose(alpha);
	}

	const history = directBodyPoseHistory.get(body as object);
	if (!history) {
		return capturePhysicsPose(body);
	}

	const latestPose = capturePhysicsPose(body);
	if (!posesEqual(latestPose, history.current)) {
		const collapsed = collapseDirectBodyPoseHistory(body as object & PhysicsPoseReadable);
		return clonePhysicsPose(collapsed.current);
	}

	return interpolatePhysicsPose(history.previous, history.current, alpha);
}

function isPhysicsPoseReadable(value: unknown): value is PhysicsPoseReadable {
	return (
		value != null &&
		typeof value === 'object' &&
		typeof (value as PhysicsPoseReadable).translation === 'function' &&
		typeof (value as PhysicsPoseReadable).rotation === 'function'
	);
}

function isRenderPoseProvider(value: unknown): value is PhysicsRenderPoseProvider {
	return (
		value != null &&
		typeof value === 'object' &&
		typeof (value as PhysicsRenderPoseProvider).getPoseHistory === 'function' &&
		typeof (value as PhysicsRenderPoseProvider).getRenderPose === 'function'
	);
}

function posesEqual(a: PhysicsPose, b: PhysicsPose): boolean {
	return (
		a.position.x === b.position.x &&
		a.position.y === b.position.y &&
		a.position.z === b.position.z &&
		a.rotation.x === b.rotation.x &&
		a.rotation.y === b.rotation.y &&
		a.rotation.z === b.rotation.z &&
		a.rotation.w === b.rotation.w
	);
}
