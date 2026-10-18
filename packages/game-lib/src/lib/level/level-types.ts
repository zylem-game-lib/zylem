/**
 * Level document shapes shared with the editor over the bridge.
 *
 * Defined here, matching `packages/bridge/src/protocol.ts`, because the
 * installed `@zylem/bridge` build does not export them yet and the
 * declaration build cannot import files outside this package.
 */

import type { BridgePose, BridgeVec3 } from '@zylem/bridge';
import type { BrushPlane } from './brush';

/** Which list in a level document an edit or a visibility toggle addresses. */
export type LevelLayerId = 'solid' | 'doodad' | 'entity';

/** One convex solid. Planes are world-space half-spaces. */
export interface BrushSolid {
	id: string;
	planes: BrushPlane[];
}

/** A visual placement. Spawned with no collider. */
export interface DoodadPlacement {
	id: string;
	typeId: string;
	pose: BridgePose;
	props: Record<string, unknown>;
}

/**
 * A gameplay marker.
 *
 * `typeId` is `spawn` or `zone`. Spawn props carry `spawnKind`
 * (`player` | `enemy` | `item`) and `archetype`. Trigger props carry `size`.
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
}

/** What the Add tool will write into the document on the next click. */
export type LevelPlacementArm =
	| { kind: 'doodad'; typeId: string; props?: Record<string, unknown> }
	| { kind: 'spawn' }
	| { kind: 'trigger'; size: BridgeVec3 };

/** Edit-time preview. Hidden layers are omitted; play ignores this and streams everything. */
export interface LevelSyncPayload {
	document: LevelDocument;
	hiddenLayers: LevelLayerId[];
	selectedIds: string[];
	activeLayer: LevelLayerId;
	placement: LevelPlacementArm | null;
}

/**
 * A finished pointer gesture. The game reports it once, on release.
 * The editor applies it to the document and syncs the result back.
 */
export type LevelGesture =
	| { kind: 'brush'; min: BridgeVec3; max: BridgeVec3 }
	| { kind: 'clip'; brushId: string; plane: BrushPlane }
	| { kind: 'vertex'; brushId: string; vertexIndex: number; position: BridgeVec3 }
	| { kind: 'translate'; id: string; layer: LevelLayerId; delta: BridgeVec3 }
	| { kind: 'doodad'; typeId: string; pose: BridgePose; props?: Record<string, unknown> }
	| { kind: 'spawn'; pose: BridgePose }
	| { kind: 'trigger'; pose: BridgePose; size: BridgeVec3 }
	| { kind: 'delete'; id: string };
