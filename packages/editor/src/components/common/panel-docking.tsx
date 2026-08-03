import {
    createEffect,
    createMemo,
    createSignal,
    Show,
    untrack,
    type Accessor,
    type Component,
    type Setter,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import {
    clampThickness,
    computeDockLayout,
    dockSlotIndex,
    findDockedSide,
    innerEdgeFor,
    isHorizontalSide,
    previewDockRect,
    type DockPanelId,
    type DockRect,
    type DockSide,
} from './dock-layout';
import { viewportSize } from './viewport';
import {
    debugStore,
    dockPanelToSide,
    setDockThickness,
    undockPanelFromSides,
} from '../editor-store';

const SNAP_PREVIEW_THRESHOLD = 24;

/** Fixed footprint every panel shrinks to while it is being moved. */
const GHOST_SIZE: PanelSize = { width: 320, height: 240 };

export type { DockSide, DockRect } from './dock-layout';

export interface PanelPosition {
    x: number;
    y: number;
}

export interface PanelSize {
    width: number;
    height: number;
}

interface DockPreviewState {
    visible: boolean;
    side: DockSide | null;
    index: number;
}

interface FittedPanel {
    position: PanelPosition;
    size: PanelSize;
}

export type ResizeMode = 'free' | 'thickness';

interface CreatePanelDockingOptions {
    /** Registry id: `'main'` for the editor panel, otherwise a section id. */
    panelId: DockPanelId;
    initialSize: PanelSize;
    minSize: PanelSize;
    position: Accessor<PanelPosition>;
    setPosition: Setter<PanelPosition>;
    size: Accessor<PanelSize>;
    setSize: Setter<PanelSize>;
    panelRef: Accessor<HTMLDivElement | undefined>;
    onPositionCommit?: (position: PanelPosition) => void;
    onSizeCommit?: (size: PanelSize) => void;
}

/**
 * Docking behavior shared by the editor's floating panels.
 *
 * Dock state is not owned here: it lives in the store's dock registry, and
 * `computeDockLayout` turns that into a rect per panel. This hook derives its
 * panel's rect from the registry and pushes it into the caller's
 * position/size signals, so a panel joining or leaving a zone, a zone
 * thickness change, or a window resize relayouts everyone at once. Free
 * (undocked) drag and resize stay entirely local to the caller.
 */
export function createPanelDocking(options: CreatePanelDockingOptions) {
    const [undockedSize, setUndockedSize] = createSignal<PanelSize>({
        width: options.initialSize.width,
        height: options.initialSize.height,
    });
    const [dockPreview, setDockPreview] = createSignal<DockPreviewState>({
        visible: false,
        side: null,
        index: 0,
    });

    /** Reads straight from the registry, so a persisted dock restores on mount. */
    const dockedSide = createMemo(() => findDockedSide(debugStore.docks, options.panelId));
    const isDocked = () => dockedSide() !== null;

    const dockRect = createMemo<DockRect | null>(() => {
        if (!dockedSide()) return null;
        const layout = computeDockLayout(debugStore.docks, viewportSize(), {
            minSlotExtent: 0,
        });
        return layout[options.panelId] ?? null;
    });

    // Docked geometry is derived, so the panel follows the registry rather than
    // tracking its own position and size. The current values are read untracked
    // so writing them back cannot re-trigger this effect.
    createEffect(() => {
        const rect = dockRect();
        if (!rect) return;
        untrack(() => {
            const currentPos = options.position();
            const currentSize = options.size();
            if (currentPos.x !== rect.x || currentPos.y !== rect.y) {
                options.setPosition({ x: rect.x, y: rect.y });
            }
            if (currentSize.width !== rect.width || currentSize.height !== rect.height) {
                options.setSize({ width: rect.width, height: rect.height });
            }
        });
    });

    /** Docked panels are always explicitly sized; only floating ones hug content. */
    const [isAutoHeightSignal, setIsAutoHeight] = createSignal(true);
    const isAutoHeight = () => !isDocked() && isAutoHeightSignal();

    /** True while the panel is dragged as a small ghost; drives the ghost look. */
    const [isMoving, setIsMoving] = createSignal(false);
    // Whether the panel should go back to hugging its content once the ghost
    // is dropped; captured at drag start.
    let ghostRestoreAutoHeight = true;

    const showDockPreview = (side: DockSide, index: number) => {
        setDockPreview({ visible: true, side, index });
    };

    const hideDockPreview = () => {
        setDockPreview({ visible: false, side: null, index: 0 });
    };

    const rememberUndockedSize = (nextSize: PanelSize) => {
        setUndockedSize({ width: nextSize.width, height: nextSize.height });
    };

    const getLiveSize = () => {
        const panelElement = options.panelRef();
        if (panelElement) {
            const rect = panelElement.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        }
        return options.size();
    };

    const getDockPreviewRect = (): DockRect | null => {
        const preview = dockPreview();
        if (!preview.visible || !preview.side) return null;
        return previewDockRect(
            debugStore.docks,
            options.panelId,
            preview.side,
            preview.index,
            viewportSize(),
        );
    };

    const clampSizeToViewport = (width: number, height: number): PanelSize => {
        const viewport = viewportSize();
        const maxWidth = Math.max(1, viewport.width);
        const maxHeight = Math.max(1, viewport.height);
        const minWidth = Math.min(options.minSize.width, maxWidth);
        const minHeight = Math.min(options.minSize.height, maxHeight);
        return {
            width: Math.min(maxWidth, Math.max(minWidth, width)),
            height: Math.min(maxHeight, Math.max(minHeight, height)),
        };
    };

    const fitPanelToViewport = (
        currentX: number,
        currentY: number,
        currentWidth: number,
        currentHeight: number,
    ): FittedPanel => {
        const viewport = viewportSize();
        const fittedSize = clampSizeToViewport(currentWidth, currentHeight);
        const maxX = Math.max(0, viewport.width - fittedSize.width);
        const maxY = Math.max(0, viewport.height - fittedSize.height);
        return {
            position: {
                x: Math.max(0, Math.min(currentX, maxX)),
                y: Math.max(0, Math.min(currentY, maxY)),
            },
            size: fittedSize,
        };
    };

    /** The side whose edge the panel has been dragged past, if any. */
    const detectDockSide = (
        x: number,
        y: number,
        width: number,
        height: number,
    ): DockSide | null => {
        const viewport = viewportSize();
        const overflows: Array<{ side: DockSide; amount: number }> = [
            { side: 'left', amount: Math.max(0, -x) },
            { side: 'right', amount: Math.max(0, x + width - viewport.width) },
            { side: 'top', amount: Math.max(0, -y) },
            { side: 'bottom', amount: Math.max(0, y + height - viewport.height) },
        ];

        const best = overflows.reduce((a, b) => (b.amount > a.amount ? b : a));
        return best.amount >= SNAP_PREVIEW_THRESHOLD ? best.side : null;
    };

    /** Slot the panel would drop into on `side`, from the pointer position. */
    const detectDockIndex = (side: DockSide, pointerX: number, pointerY: number): number =>
        dockSlotIndex(
            debugStore.docks,
            side,
            { x: pointerX, y: pointerY },
            viewportSize(),
            options.panelId,
        );

    /**
     * Start moving the panel: shrink it to the fixed ghost footprint (keeping
     * the grab point under the pointer), undock it if needed, and remember
     * what to restore on drop. The small ghost is what makes free placement
     * possible — a full-size panel overflows viewport edges almost anywhere,
     * which is what used to trigger accidental docking.
     */
    const beginDragGhost = (pointerX: number, pointerY: number): FittedPanel => {
        const currentPos = options.position();
        const currentSize = getLiveSize();
        if (isDocked()) {
            // A docked panel restores the size it had before docking.
            ghostRestoreAutoHeight = true;
        } else {
            rememberUndockedSize(currentSize);
            ghostRestoreAutoHeight = isAutoHeightSignal();
        }

        const ghost = clampSizeToViewport(GHOST_SIZE.width, GHOST_SIZE.height);
        const pointerRatioX = currentSize.width > 0
            ? Math.max(0, Math.min(1, (pointerX - currentPos.x) / currentSize.width))
            : 0;
        const pointerRatioY = currentSize.height > 0
            ? Math.max(0, Math.min(1, (pointerY - currentPos.y) / currentSize.height))
            : 0;
        const fitted = fitPanelToViewport(
            pointerX - ghost.width * pointerRatioX,
            pointerY - ghost.height * pointerRatioY,
            ghost.width,
            ghost.height,
        );

        undockPanelFromSides(options.panelId);
        options.setSize(fitted.size);
        options.setPosition(fitted.position);
        setIsAutoHeight(false);
        setIsMoving(true);
        hideDockPreview();
        return fitted;
    };

    /**
     * Drop the ghost without docking: restore the remembered floating size at
     * the drop position and commit the result.
     */
    const endDragGhost = (): FittedPanel => {
        const preferred = undockedSize();
        const restored = clampSizeToViewport(preferred.width, preferred.height);
        const currentPos = options.position();
        const fitted = fitPanelToViewport(
            currentPos.x,
            currentPos.y,
            restored.width,
            restored.height,
        );

        options.setSize(fitted.size);
        options.setPosition(fitted.position);
        setIsAutoHeight(ghostRestoreAutoHeight);
        setIsMoving(false);
        options.onSizeCommit?.(fitted.size);
        options.onPositionCommit?.(fitted.position);
        return fitted;
    };

    /**
     * Start a resize. Dragging the edge a docked panel exposes to the viewport
     * resizes its zone; any other edge pulls the panel out of the dock first.
     */
    const beginResize = (direction: string | null): { size: PanelSize; mode: ResizeMode } => {
        hideDockPreview();
        const side = dockedSide();

        if (side && direction && direction === innerEdgeFor(side)) {
            const currentSize = getLiveSize();
            options.setSize(currentSize);
            setIsAutoHeight(false);
            return { size: currentSize, mode: 'thickness' };
        }

        if (side) {
            undockPanelFromSides(options.panelId);
        }
        const currentSize = getLiveSize();
        options.setSize(currentSize);
        setIsAutoHeight(false);
        return { size: currentSize, mode: 'free' };
    };

    /**
     * Apply a thickness resize from a pointer delta. The zone's cross-axis
     * extent and the panel's position both follow from the registry.
     */
    const resizeDockThickness = (startThickness: number, deltaX: number, deltaY: number) => {
        const side = dockedSide();
        if (!side) return;

        const horizontal = isHorizontalSide(side);
        const delta = horizontal ? deltaX : deltaY;
        // Left and top grow away from their edge; right and bottom grow toward it.
        const signed = side === 'left' || side === 'top' ? delta : -delta;
        const minThickness = horizontal ? options.minSize.width : options.minSize.height;
        const next = clampThickness(
            debugStore.docks,
            side,
            startThickness + signed,
            viewportSize(),
            minThickness,
        );
        setDockThickness(side, next);
    };

    const clearDockedSide = () => {
        undockPanelFromSides(options.panelId);
    };

    /** Commit a hovering dock preview. Returns the side taken, or null. */
    const applyDockPreview = (): { side: DockSide; index: number } | null => {
        const preview = dockPreview();
        if (!preview.visible || !preview.side) return null;

        if (!isDocked()) {
            rememberUndockedSize(options.size());
        }

        dockPanelToSide(options.panelId, preview.side, preview.index);
        setIsAutoHeight(false);
        setIsMoving(false);
        hideDockPreview();
        return { side: preview.side, index: preview.index };
    };

    const restoreUndockedPanel = (): FittedPanel => {
        const preferred = undockedSize();
        const restored = clampSizeToViewport(preferred.width, preferred.height);
        const currentPos = options.position();
        const fitted = fitPanelToViewport(
            currentPos.x,
            currentPos.y,
            restored.width,
            restored.height,
        );

        undockPanelFromSides(options.panelId);
        options.setSize(fitted.size);
        options.setPosition(fitted.position);
        setIsAutoHeight(true);
        options.onSizeCommit?.(fitted.size);
        options.onPositionCommit?.(fitted.position);
        return fitted;
    };

    /** Imperative dock command, for host APIs and toolbar buttons. */
    const dockTo = (side: DockSide | null) => {
        if (side === null) {
            if (isDocked()) restoreUndockedPanel();
            return;
        }
        if (!isDocked()) {
            rememberUndockedSize(options.size());
        }
        dockPanelToSide(options.panelId, side);
        setIsAutoHeight(false);
    };

    /**
     * Keep a floating panel inside a resized viewport. Docked panels need no
     * handling here; their rects are derived from the viewport signal.
     */
    const fitFloatingPanelToViewport = () => {
        if (isDocked()) return;

        const currentPos = options.position();
        const currentSize = isAutoHeight() ? getLiveSize() : options.size();
        const fitted = fitPanelToViewport(
            currentPos.x,
            currentPos.y,
            currentSize.width,
            currentSize.height,
        );

        if (
            currentSize.width !== fitted.size.width
            || currentSize.height !== fitted.size.height
        ) {
            options.setSize(fitted.size);
            options.onSizeCommit?.(fitted.size);
        }
        if (currentPos.x !== fitted.position.x || currentPos.y !== fitted.position.y) {
            options.setPosition(fitted.position);
            options.onPositionCommit?.(fitted.position);
        }
    };

    // One shared viewport signal replaces the per-panel resize listeners.
    createEffect(() => {
        viewportSize();
        untrack(fitFloatingPanelToViewport);
    });

    return {
        dockedSide,
        dockRect,
        isAutoHeight,
        setIsAutoHeight,
        showDockPreview,
        hideDockPreview,
        rememberUndockedSize,
        getLiveSize,
        getDockPreviewRect,
        detectDockSide,
        detectDockIndex,
        beginDragGhost,
        endDragGhost,
        isMoving,
        clampSizeToViewport,
        fitPanelToViewport,
        beginResize,
        resizeDockThickness,
        clearDockedSide,
        applyDockPreview,
        restoreUndockedPanel,
        dockTo,
    };
}

export const DockPreviewOverlay: Component<{
    rect: DockRect | null;
    zIndex: number;
}> = (props) => (
    <Show when={props.rect}>
        {(previewRect) => (
            <Portal>
                <div
                    style={{
                        position: 'fixed',
                        left: `${previewRect().x}px`,
                        top: `${previewRect().y}px`,
                        width: `${previewRect().width}px`,
                        height: `${previewRect().height}px`,
                        'z-index': props.zIndex,
                        'pointer-events': 'none',
                        'box-sizing': 'border-box',
                        border: '2px dashed var(--zylem-color-primary)',
                        background: 'rgba(10, 20, 30, 0.2)',
                        'border-radius': '0',
                    }}
                />
            </Portal>
        )}
    </Show>
);
