/**
 * Drag-rectangle selection for the Select tool.
 *
 * A gesture state machine the debug delegate feeds pointer events into. A
 * left button press arms it; moving past a small threshold turns the press
 * into a marquee (so an ordinary click still reaches the single-pick path);
 * releasing casts the rectangle's frustum through every entity and writes
 * the result into `debugState`, merged with the selection that existed when
 * the drag began according to the modifier keys held at press time.
 */
import { Box3, type Camera, Frustum, Vector2 } from 'three';
import { debugState, setSelectedEntityIds } from '../debug/debug-state';
import {
	frustumCatchesBox,
	frustumFromNdcRect,
	mergeModeFromModifiers,
	mergeSelection,
	type SelectionMergeMode,
} from '../debug/marquee-frustum';
import { resolveSelectionBounds } from '../debug/selection-bounds';
import { MarqueeOverlay, resolveMarqueeHost } from './marquee-overlay';

/** Pixels the pointer must travel before a press becomes a drag. */
export const MARQUEE_DRAG_THRESHOLD_PX = 4;

export interface MarqueeSelectContext {
	getCamera(): Camera | null;
	/**
	 * Visit every entity the marquee may catch. Each is measured through
	 * `resolveSelectionBounds`, so entities without a selectable volume are
	 * skipped here rather than filtered by the caller.
	 */
	forEachEntity(visit: (uuid: string, entity: unknown) => void): void;
}

export interface MarqueePointer {
	clientX: number;
	clientY: number;
	shiftKey: boolean;
	altKey: boolean;
}

/** What a release resolved to, so the caller knows whether to run the click path. */
export type MarqueeRelease = 'idle' | 'click' | 'marquee';

const _box = new Box3();
const _frustum = new Frustum();

export class StageMarqueeSelect {
	private readonly context: MarqueeSelectContext;
	private readonly overlay = new MarqueeOverlay();

	private armed = false;
	private dragging = false;
	private mode: SelectionMergeMode = 'replace';
	private baseSelection: string[] = [];
	private startNdc = new Vector2();
	private currentNdc = new Vector2();
	private startClient = new Vector2();
	private currentClient = new Vector2();
	private host: HTMLElement | null = null;

	constructor(context: MarqueeSelectContext) {
		this.context = context;
	}

	/** A press has been recorded and not yet released. */
	get isArmed(): boolean {
		return this.armed;
	}

	/** The press has travelled far enough to be a marquee. */
	get isDragging(): boolean {
		return this.dragging;
	}

	/** Record a left-button press. The mode is fixed here, from the modifiers held. */
	pointerDown(ndc: Vector2, pointer: MarqueePointer, canvas: HTMLElement): void {
		this.armed = true;
		this.dragging = false;
		this.mode = mergeModeFromModifiers(pointer);
		this.baseSelection = [...debugState.selectedEntityIds];
		this.startNdc.copy(ndc);
		this.currentNdc.copy(ndc);
		this.startClient.set(pointer.clientX, pointer.clientY);
		this.currentClient.copy(this.startClient);
		this.host = resolveMarqueeHost(canvas);
	}

	/**
	 * Track the pointer. Returns `true` on the one move that crosses the drag
	 * threshold, so the caller can take pointer capture at that moment.
	 */
	pointerMove(ndc: Vector2, pointer: { clientX: number; clientY: number }): boolean {
		if (!this.armed) return false;
		this.currentNdc.copy(ndc);
		this.currentClient.set(pointer.clientX, pointer.clientY);

		let becameDrag = false;
		if (!this.dragging) {
			const distance = this.currentClient.distanceTo(this.startClient);
			if (distance < MARQUEE_DRAG_THRESHOLD_PX) return false;
			this.dragging = true;
			becameDrag = true;
		}
		this.drawOverlay();
		return becameDrag;
	}

	/**
	 * Release. A marquee commits the selection; a press that never became a
	 * drag is reported as a click for the caller's single-pick path.
	 */
	pointerUp(ndc: Vector2): MarqueeRelease {
		if (!this.armed) return 'idle';
		const wasDragging = this.dragging;
		this.currentNdc.copy(ndc);
		this.reset();
		if (!wasDragging) return 'click';
		this.commit();
		return 'marquee';
	}

	/** Abandon the gesture without touching the selection. */
	cancel(): void {
		this.reset();
	}

	dispose(): void {
		this.reset();
		this.overlay.dispose();
	}

	private reset(): void {
		this.armed = false;
		this.dragging = false;
		this.overlay.hide();
	}

	private drawOverlay(): void {
		if (!this.host) return;
		const hostRect = this.host.getBoundingClientRect();
		const left = Math.min(this.startClient.x, this.currentClient.x) - hostRect.left;
		const top = Math.min(this.startClient.y, this.currentClient.y) - hostRect.top;
		this.overlay.show(this.host, {
			left,
			top,
			width: Math.abs(this.currentClient.x - this.startClient.x),
			height: Math.abs(this.currentClient.y - this.startClient.y),
		});
	}

	/** Cast the rectangle's frustum and write the merged selection. */
	private commit(): void {
		const camera = this.context.getCamera();
		if (!camera) return;

		frustumFromNdcRect(camera, this.startNdc, this.currentNdc, _frustum);

		// Tested against the same padded view the outline draws, so a drag that
		// grazes a flat plane's slab selects it exactly as the highlight implies.
		const caught: string[] = [];
		this.context.forEachEntity((uuid, entity) => {
			const bounds = resolveSelectionBounds(entity, _box);
			if (bounds && frustumCatchesBox(_frustum, bounds)) caught.push(uuid);
		});

		setSelectedEntityIds(mergeSelection(this.baseSelection, caught, this.mode));
	}
}
