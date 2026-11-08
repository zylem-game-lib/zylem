import type { BrushPlane } from './level/brush';
import type { BrushElementKind } from './level/brush-edit';
import type { BrushFootprint, BrushFrame, BrushShape } from './level/brush-shapes';

/**
 * Editor ↔ game bridge protocol.
 *
 * Single source of truth for every message exchanged between a running
 * Zylem game (`@zylem/game-lib`) and the editor overlay (`@zylem/editor`).
 * Both packages depend on this module only — they never import each other's
 * internals — which keeps the two custom elements fully decoupled while
 * sharing one typed contract.
 */

/** Plain `{ x, y, z }` vector used across bridge payloads. */
export interface BridgeVec3 {
	x: number;
	y: number;
	z: number;
}

/** Plain quaternion. Authoritative orientation for editor transforms. */
export interface BridgeQuat {
	x: number;
	y: number;
	z: number;
	w: number;
}

/**
 * A partial transform. Euler `rotation` is carried for display and numeric
 * entry; `quaternion` is authoritative when present, since round-tripping an
 * orientation through Euler angles drifts and can hit gimbal degeneracy.
 */
export interface BridgePose {
	position?: BridgeVec3;
	/** Euler angles in radians. */
	rotation?: BridgeVec3;
	quaternion?: BridgeQuat;
	scale?: BridgeVec3;
}

/** Editor toolbar tools mirrored into the game debug state. */
export type BridgeDebugTool =
	| 'select'
	| 'translate'
	| 'rotate'
	| 'scale'
	| 'delete'
	| 'add'
	| 'brush'
	| 'clip'
	| 'shear'
	| 'none';

/** Display / runtime configuration of the running game. */
export interface GameConfigPayload {
	id: string;
	aspectRatio: number;
	fullscreen: boolean;
	bodyBackground: string | undefined;
	internalResolution: { width: number; height: number } | undefined;
	debug: boolean;
}

/** Loading lifecycle updates (start → progress → complete). */
export interface GameLoadingPayload {
	phase: 'start' | 'progress' | 'complete';
	progress?: number;
	stageName?: string;
	stageIndex?: number;
}

/** Stage configuration surfaced in the editor stage panel. */
export interface StageConfigPayload {
	id: string;
	backgroundColor: string;
	backgroundImage: string | null;
	gravity: BridgeVec3;
	inputs: Record<string, string[]>;
	variables: Record<string, unknown>;
}

/** Per-entity summary rendered in the editor entity list. */
export interface EntitySummaryPayload {
	uuid: string;
	name: string;
	type: string;
	position: BridgeVec3;
	rotation: BridgeVec3;
	scale: BridgeVec3;
	/** Authoritative orientation, when the game can supply one. */
	quaternion?: BridgeQuat;
	/** Preview image URL (blob or data URL), when available. */
	thumbnail?: string | null;
	/** World-space AABB size used for thumbnail rulers. */
	bounds?: { width: number; height: number; depth: number };
}

/** Full stage snapshot: config plus the complete entity list. */
export interface StageSnapshotPayload {
	stage: StageConfigPayload | null;
	entities: EntitySummaryPayload[];
}

/** Thumbnail ready notification for one entity. */
export interface EntityThumbnailPayload {
	uuid: string;
	/** Blob URL (preferred) or PNG data URL of the framed preview. */
	url: string;
	bounds: { width: number; height: number; depth: number };
}

/** Game global-variable change mirrored to the editor. */
export interface GameVariablePayload {
	path: string;
	value: unknown;
	previousValue?: unknown;
}

/** One-off diagnostic message surfaced in the editor console. */
export interface GameNoticePayload {
	level: 'info' | 'warn' | 'error';
	message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Swatches (live shader / behavior application)
// ─────────────────────────────────────────────────────────────────────────────

export type SwatchKind = 'shader' | 'behavior';

/**
 * A configured shader or behavior, described by what it resolves to rather
 * than by a closure. `source` is the export name (`createLava`,
 * `ThrusterBehavior`) that the game side registered as a swatch source, so the
 * live path and generated code agree on one identifier.
 */
export interface SwatchSpec {
	kind: SwatchKind;
	/** Shader factory or behavior descriptor export name. */
	source: string;
	/** Factory options (shader) or overrides over `defaultOptions` (behavior). */
	props: Record<string, unknown>;
}

/**
 * Apply swatches to live entities without a rebuild.
 *
 * Batch-shaped from the start: the game applies every swatch to every uuid
 * (cartesian product, in order) under one operation, so a drag-and-drop sends
 * arrays of one while a multi-select apply from the editor reuses the same
 * message and yields a single undo step. Within a batch the last shader wins
 * per entity and behaviors replace any already attached with the same key.
 */
export interface EntityApplySwatchPayload {
	/** Operation id for the resulting `scene:operation`; minted by the game when absent. */
	opId?: string;
	uuids: string[];
	swatches: SwatchSpec[];
	/** Make the successfully targeted entities the current selection. */
	select?: boolean;
}

export type SwatchApplyFailureReason =
	| 'entity-not-found'
	| 'unknown-source'
	| 'no-material'
	| 'invalid-props';

/** Outcome of applying one swatch to one entity. */
export interface SwatchApplyResult {
	uuid: string;
	kind: SwatchKind;
	source: string;
	ok: boolean;
	/** A behavior with the same key was already attached and got replaced. */
	replaced?: boolean;
	reason?: SwatchApplyFailureReason;
}

/**
 * Answer to `entity:apply-swatch`. One result per uuid × swatch pair, in the
 * order they were attempted. Partial success is normal for batches: targets
 * that can accept the swatch still receive it when others cannot.
 */
export interface EntitySwatchAppliedPayload {
	opId: string;
	results: SwatchApplyResult[];
}

/** Normalized device coordinates, `-1..1` on both axes with +y up. */
export interface BridgeNdc {
	x: number;
	y: number;
}

/**
 * Raycast request at a pointer position. The `requestId` lets a consumer
 * streaming picks during a drag match each answer to its pointer event.
 */
export interface EntityPickPayload {
	requestId: string;
	ndc: BridgeNdc;
}

export interface EntityPickResultPayload {
	requestId: string;
	hit: EntitySummaryPayload | null;
}

export interface EntitySelectionPayload {
	/** First entry of {@link selectedUuids}, kept for single-select consumers. */
	selectedUuid: string | null;
	hoveredUuid: string | null;
	/**
	 * Full selection, in selection order. Holds several uuids after a marquee
	 * drag, a shift-click, or an `entity:select` with `uuids`.
	 */
	selectedUuids?: string[];
}

/**
 * How an `entity:select` with several uuids combines with the current
 * selection. Omitted (or `replace`) swaps the selection wholesale.
 */
export type EntitySelectMode = 'replace' | 'add' | 'subtract' | 'toggle';

export interface EntitySelectPayload {
	/** Single-entity form; `null` clears. Ignored when {@link uuids} is set. */
	uuid: string | null;
	/** Multi-entity form. */
	uuids?: string[];
	mode?: EntitySelectMode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene operations (undo/redo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What a {@link SceneOperationPayload} did.
 *
 * - `transform` — poses changed; invert by writing `before`.
 * - `create` — entities were spawned; invert by detaching them.
 * - `delete` — entities were detached; invert by restoring them.
 * - `swatch` — shaders/behaviors were applied; invert by restoring the
 *   game-side snapshot taken before the apply.
 */
export type SceneOperationKind = 'transform' | 'create' | 'delete' | 'swatch';

/** One entity's participation in a scene operation. */
export interface SceneOperationEntry {
	uuid: string;
	before?: BridgePose;
	after?: BridgePose;
	/** The swatch that was applied (`swatch` operations). */
	swatch?: SwatchSpec;
	/** Behavior with the same key that the apply displaced, if any. */
	replaced?: { source: string; props: Record<string, unknown> };
}

/**
 * A committed, invertible change to the stage.
 *
 * Published by the game because every editing gesture originates game-side
 * (gizmo drags, placement clicks, delete clicks). The editor stores these as
 * its undo stack and replays them via `scene:operation:apply` — it never has
 * to reconstruct an entity, which it could not do from an
 * {@link EntitySummaryPayload} alone.
 */
export interface SceneOperationPayload {
	opId: string;
	kind: SceneOperationKind;
	/** Human-readable summary, e.g. `Move Box`. */
	label: string;
	entries: SceneOperationEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Entity catalog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A placeable entity type offered by the game, rendered in the editor's Add
 * palette. Deliberately serializable: the factory itself stays game-side, so
 * hosts (e.g. Creator) extend the palette by registering types with the game
 * rather than passing closures across the bridge.
 */
export interface EntityTypeDescriptor {
	id: string;
	label: string;
	/** Inline SVG markup for the palette entry and armed Add button. */
	icon?: string;
	/** Searched alongside `label`, and used for palette grouping. */
	tags?: string[];
	/** Group heading in the palette. */
	group?: string;
	description?: string;
	/** Creation options the palette entry defaults to. */
	defaultProps?: Record<string, unknown>;
}

/** Snap increments applied to gizmo drags, in world units / radians. */
export interface SnapSettingsPayload {
	enabled: boolean;
	/** World units per translation step. */
	translate: number;
	/** Radians per rotation step. */
	rotate: number;
	/** Scale factor per step. */
	scale: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cutscenes (Director mode ↔ `@zylem/game-lib/cinematics`)
// ─────────────────────────────────────────────────────────────────────────────

export type CutscenePlaybackState = 'idle' | 'playing' | 'paused' | 'finished';

/**
 * Load (or replace) the cutscene the game previews. The definition is the
 * runtime `CutsceneDefinition` shape; it is carried untyped here so the
 * bridge does not depend on game-lib's schemas.
 */
export interface CutsceneLoadPayload {
	definition: Record<string, unknown>;
	/** Start playing once loaded; otherwise the game waits for `cutscene:play`. */
	autoplay?: boolean;
	/** Seconds to seek to after loading. */
	time?: number;
}

/** Playback status the game publishes while a cutscene is loaded. */
export interface CutsceneStatusPayload {
	/** `null` when nothing is loaded. */
	cutsceneId: string | null;
	state: CutscenePlaybackState;
	/** Seconds. */
	time: number;
	sceneId: string | null;
	shotId: string | null;
}

/**
 * The live camera's projection while a cutscene is previewed, so an editor
 * can draw world-space guides (dolly paths, handles) over the game and map
 * pointer positions back into the world. Published whenever it changes.
 */
export interface CutsceneViewPayload {
	/** Column-major world → clip matrix (`projection × view`), 16 numbers. */
	viewProjection: number[];
	/** Its inverse, clip → world, for unprojecting pointer positions. */
	inverseViewProjection: number[];
	/** The render surface's box in the game document's CSS pixels. */
	viewport: { x: number; y: number; width: number; height: number };
}

/**
 * One placed entity in a level buffer.
 *
 * `id` is the live entity uuid while the level is being edited. `typeId` is a
 * catalog id (`box`), not the constructor symbol the entity list shows (`Box`).
 */
export interface LevelEntry {
	id: string;
	typeId: string;
	pose: BridgePose;
}

/**
 * A level the editor records and the game can stream back into a stage.
 *
 * `version` is bumped when the shape changes, so an old buffer is recognisable.
 */
export interface LevelBuffer {
	version: 1;
	entries: LevelEntry[];
}

/** Which list in a level document an edit or a visibility toggle addresses. */
export type LevelLayerId = 'solid' | 'doodad' | 'entity';

/** One convex solid. Planes are world-space half-spaces. */
export interface BrushSolid {
	id: string;
	planes: BrushPlane[];
	/**
	 * Solids baked from one primitive (an arch's segments) share a group.
	 * A click selects the whole group; a double-click selects one member.
	 */
	groupId?: string;
}

/** The sector grid: square XZ cells `size` units wide. A solid belongs to the cell holding its center. */
export interface LevelSectorSettings {
	size: number;
}

/** A visual placement. Spawned with no collider. */
export interface DoodadPlacement {
	id: string;
	typeId: string;
	pose: BridgePose;
	props: Record<string, unknown>;
}

/** What a spawn marker spawns. Stored in its `props.spawnKind`. */
export type LevelSpawnKind = 'player' | 'enemy' | 'item';

/**
 * A gameplay marker.
 *
 * `typeId` is `spawn` or `zone`. Spawn props carry `spawnKind`
 * ({@link LevelSpawnKind}) and `archetype`. Trigger props carry `size`.
 */
export interface EntityPlacement {
	id: string;
	typeId: string;
	name: string;
	pose: BridgePose;
	props: Record<string, unknown>;
}

/**
 * The level file. The editor owns it; the stage only previews and plays it.
 *
 * `version` is 2 so a v1 catalog buffer is recognisable and left alone.
 */
export interface LevelDocument {
	version: 2;
	solids: BrushSolid[];
	doodads: DoodadPlacement[];
	entities: EntityPlacement[];
	/** Absent means the default sector size. */
	sectors?: LevelSectorSettings;
}

/** What a click on a solid picks: the whole solid, or one of its vertices, edges, or faces. */
export type LevelElementMode = 'object' | 'vertex' | 'edge' | 'face';

/**
 * One part of a solid, named by plane indices: a face by its plane, an edge
 * by the two planes either side, a vertex by every plane through it. Indices
 * are ascending. The names survive undo because they never hold positions.
 */
export interface LevelElementRef {
	brushId: string;
	kind: BrushElementKind;
	planes: number[];
}

/** The primitive the brush tool draws, with every option filled in. */
export interface LevelDrawShape {
	shape: BrushShape;
	/** Quarter turns: the edge a wedge rises toward, or the axis an arch spans. */
	turn: number;
	/** Cylinder side count. */
	sides: number;
	/** Arch segment count. */
	segments: number;
	/** Arch ring thickness in world units. */
	thickness: number;
}

/** A whole-object transform. Rotate and scale act about `pivot`. */
export type LevelTransform =
	| { kind: 'translate'; delta: BridgeVec3 }
	| { kind: 'rotate'; axis: BridgeVec3; angle: number; pivot: BridgeVec3 }
	| { kind: 'scale'; factor: BridgeVec3; pivot: BridgeVec3 };

/** What the Add tool will write into the document on the next click. */
export type LevelPlacementArm =
	| { kind: 'doodad'; typeId: string; props?: Record<string, unknown> }
	| { kind: 'spawn' }
	| { kind: 'trigger'; size: BridgeVec3 };

/** Edit-time preview. Hidden layers are omitted; play ignores this and streams everything. */
export interface LevelSyncPayload {
	document: LevelDocument;
	hiddenLayers: LevelLayerId[];
	/** Sector keys (`x:z`) whose solids are left out of the preview. */
	hiddenSectors?: string[];
	/** Tint each solid by its sector. The sector grid shows either way. */
	showSectorTint?: boolean;
	/** Selected objects of any layer. In an element mode, the solids that own the selected elements. */
	selectedIds: string[];
	/** Absent means `object`. */
	elementMode?: LevelElementMode;
	/** Selected vertices, edges, or faces, matching `elementMode`. */
	elements?: LevelElementRef[];
	activeLayer: LevelLayerId;
	placement: LevelPlacementArm | null;
	/** The armed primitive while the brush tool is on. */
	drawShape?: LevelDrawShape | null;
}

/**
 * A finished pointer gesture. The game reports it once, on release.
 * The editor applies it to the document and syncs the result back; an edit
 * that would leave a solid non-convex or empty is dropped and the preview
 * snaps back.
 */
export type LevelGesture =
	/** A primitive drawn on a plane; see `primitiveBrushes`. */
	| {
			kind: 'primitive';
			frame: BrushFrame;
			footprint: BrushFootprint;
			height: number;
			shape: LevelDrawShape;
	  }
	/** Split every listed solid by the plane. */
	| { kind: 'clip'; brushIds: string[]; plane: BrushPlane }
	/** Push or pull faces along their own normals. */
	| { kind: 'face-move'; faces: LevelElementRef[]; distance: number }
	/** Sweep each face into a new solid. */
	| { kind: 'face-extrude'; faces: LevelElementRef[]; distance: number }
	/** Move vertices, edges, or faces by one delta and rebuild each solid's hull. */
	| { kind: 'element-move'; elements: LevelElementRef[]; delta: BridgeVec3 }
	/** Slide faces within their own planes. */
	| { kind: 'shear'; faces: LevelElementRef[]; delta: BridgeVec3 }
	/** Translate, rotate, or scale whole objects of any layer. */
	| { kind: 'transform'; ids: string[]; transform: LevelTransform }
	| { kind: 'doodad'; typeId: string; pose: BridgePose; props?: Record<string, unknown> }
	| { kind: 'spawn'; pose: BridgePose }
	| { kind: 'trigger'; pose: BridgePose; size: BridgeVec3 }
	| { kind: 'delete'; id: string }
	/** Drop these elements' vertices and rebuild each solid. */
	| { kind: 'element-delete'; elements: LevelElementRef[] };

/** A click in the level preview. Not an undo step. */
export interface LevelSelectPayload {
	/** The clicked object, or `null` for empty space. In an element mode, the solid that owns the element. */
	id: string | null;
	/** The clicked vertex, edge, or face while an element mode is on. */
	elements?: LevelElementRef[];
	/** Shift-click: toggle the hit in or out of the selection instead of replacing it. */
	additive?: boolean;
	/** Double-click: select the one solid hit instead of its whole group. */
	ungroup?: boolean;
}

/**
 * Sentinel id for `camera:activate`. Releases the main view to the game
 * camera the game last asked to show.
 */
export const GAME_CAMERA_ID = 'game';

/**
 * Editor view cameras. Created only while an editor is attached, one instance
 * per view. `side` is the right orthographic view and `isometric` is the
 * iso right/top corner, kept under their original ids. `perspective` is a
 * locked perspective camera. `free` is the perspective orbit camera.
 */
export const EDITOR_CAMERAS = {
	side: 'editor:side',
	left: 'editor:left',
	top: 'editor:top',
	bottom: 'editor:bottom',
	isometric: 'editor:isometric',
	isoLeftTop: 'editor:iso-left-top',
	isoRightBottom: 'editor:iso-right-bottom',
	isoLeftBottom: 'editor:iso-left-bottom',
	perspective: 'editor:perspective',
	free: 'editor:free',
} as const;

export type EditorCameraName = (typeof EDITOR_CAMERAS)[keyof typeof EDITOR_CAMERAS];

/** A camera pose in world space, for capturing framing from the viewport. */
export interface CameraPosePayload {
	requestId: string;
	position: BridgeVec3;
	/** A point in front of the camera, so the pose round-trips as position + lookAt. */
	lookAt: BridgeVec3;
	/** Vertical field of view in degrees; absent for orthographic cameras. */
	fov?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message maps
// ─────────────────────────────────────────────────────────────────────────────

/** Messages published by the game side, consumed by the editor. */
export type GameToEditorMessages = {
	'game:config': GameConfigPayload;
	'game:loading': GameLoadingPayload;
	'game:status': { paused?: boolean; debug?: boolean };
	'game:variable': GameVariablePayload;
	'game:notice': GameNoticePayload;
	'stage:snapshot': StageSnapshotPayload;
	'entity:upsert': EntitySummaryPayload[];
	'entity:removed': { uuids: string[] };
	'entity:thumbnail': EntityThumbnailPayload[];
	'entity:selection': EntitySelectionPayload;
	'catalog:snapshot': { entities: EntityTypeDescriptor[] };
	'scene:operation': SceneOperationPayload;
	'entity:pick:result': EntityPickResultPayload;
	'entity:swatch-applied': EntitySwatchAppliedPayload;
	'cutscene:status': CutsceneStatusPayload;
	'cutscene:view': CutsceneViewPayload;
	'camera:pose': CameraPosePayload;
	/** A finished level-editing gesture. The editor applies it to the document. */
	'level:gesture': { gesture: LevelGesture };
	/** A click on a preview object or element, or on empty space. */
	'level:select': LevelSelectPayload;
};

/** Commands published by the editor, consumed by the game. */
export type EditorToGameMessages = {
	'debug:set': { enabled: boolean };
	'tool:set': { tool: BridgeDebugTool };
	'playback:set': { paused: boolean };
	'entity:select': EntitySelectPayload;
	'entity:focus': { uuid: string };
	'entity:transform': {
		uuid: string;
		position?: BridgeVec3;
		rotation?: BridgeVec3;
		quaternion?: BridgeQuat;
		scale?: BridgeVec3;
	};
	'entity:create': {
		typeId: string;
		props?: Record<string, unknown>;
		pose?: BridgePose;
	};
	/** Stream a recorded level into the running stage. */
	'level:load': { buffer: LevelBuffer };
	/** Replace the edit-time preview. Does not build collision. */
	'level:sync': LevelSyncPayload;
	/** Respawn the document for play: one merged mesh and one static body per sector, live zones. */
	'level:play': { document: LevelDocument };
	/** Drop the preview and any play collision. The stage's own entities stay. */
	'level:close': Record<string, never>;
	'scene:operation:apply': {
		op: SceneOperationPayload;
		direction: 'undo' | 'redo';
	};
	/** Arm the add tool with a catalog type, or `null` to disarm. */
	'add:type:set': { typeId: string | null; props?: Record<string, unknown> };
	'snap:set': SnapSettingsPayload;
	'grid:set': { visible: boolean };
	'stage:variable:set': { key: string; value: unknown };
	/**
	 * Arm host-driven hover picking (e.g. while a swatch is being dragged over
	 * the viewport). While armed, `entity:pick` also updates the hover highlight.
	 */
	'pick:mode:set': { enabled: boolean };
	/** Raycast at a pointer position; answered by `entity:pick:result`. */
	'entity:pick': EntityPickPayload;
	'entity:apply-swatch': EntityApplySwatchPayload;
	'cutscene:load': CutsceneLoadPayload;
	'cutscene:play': { from?: number };
	'cutscene:pause': Record<string, never>;
	'cutscene:stop': Record<string, never>;
	/** Scrub to a time without firing events. */
	'cutscene:seek': { time: number };
	/** Drop the loaded cutscene and hand the camera back to gameplay. */
	'cutscene:unload': Record<string, never>;
	/** Ask for the live camera's pose; answered by `camera:pose`. */
	'camera:pose:get': { requestId: string };
	/**
	 * Make `id` the main view.
	 *
	 * `game` releases to the remembered game camera. `editor:side`,
	 * `editor:top`, `editor:isometric`, and `editor:free` are the editor
	 * views. Any other id is a game-registered camera name.
	 */
	'camera:activate': { id: string };
};

/** Combined message map carried by a single bridge channel. */
export type BridgeMessages = GameToEditorMessages & EditorToGameMessages;

export type BridgeMessageType = keyof BridgeMessages;

/**
 * DOM event dispatched (bubbles + composed) from the game element when its
 * bridge side connects, so decoupled listeners can detect a live game
 * without polling.
 */
export const BRIDGE_READY_EVENT = 'zylem:bridge:ready';
