export const StageBodyKind = {
	Dynamic: 0,
	Static: 1,
	KinematicPosition: 2,
	KinematicVelocity: 3,
} as const;

export const StageBoundaryDim = {
	Two: 2,
	Three: 3,
} as const;

export const StageRicochetDim = {
	Two: 2,
	Three: 3,
} as const;

export const StageRicochetReflection = {
	Mirror: 0,
	Angled: 1,
} as const;

export const StageTopDownPlane = {
	Xy: 0,
	Xz: 1,
} as const;

export const StageEventType = {
	CollisionStarted: 1,
	CollisionStopped: 2,
	BoundaryHit: 3,
	Ricochet: 4,
	RegionEntered: 5,
	JumpStarted: 6,
	Landed: 7,
	Wrapped: 8,
	CooldownFired: 9,
} as const;

export interface WasmStageRuntime {
	getPose(handle: number): any;
	attachThruster(handle: number, opts: any): boolean;
	setThrusterInput(handle: number, thrust: number, rotate: number): void;
	attachTopDown(handle: number, opts: { plane: number; speed: number; faceMovement?: boolean }): boolean;
	setTopDownInput(handle: number, moveX: number, moveY: number): void;
	attachShooter2D(handle: number, opts: any): boolean;
	attachScreenWrap(handle: number, opts: any): boolean;
	queryScreenWrap(handle: number): any;
	attachWorldBoundary(handle: number, dim: number, opts: any): boolean;
	queryWorldBoundary(handle: number): any;
	attachRicochet(handle: number, dim: number, opts: any): boolean;
	attachPlatformer3D(handle: number, opts: any): boolean;
	setPlatformer3DInputAxes(handle: number, moveX: number, moveZ: number): void;
	setPlatformer3DInputButtons(handle: number, jump: boolean, run: boolean): void;
	attachFirstPerson(handle: number, opts: any): boolean;
	setFirstPersonInput(handle: number, input: any): void;
	attachJumper2D(handle: number, opts: any): boolean;
	setJumper2DInput(handle: number, jumpPressed: boolean): void;
	attachJumper3D(handle: number, opts: any): boolean;
	setJumper3DInput(handle: number, jumpPressed: boolean): void;
}

/** Default options used when constructing a wasm-backed Stage runtime. */
export interface WasmStageRuntimeOptions {
	initialCapacity?: number;
	gravity?: readonly [number, number, number];
	imports?: WebAssembly.Imports;
}
