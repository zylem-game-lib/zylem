import {
    createEffect,
    createSignal,
    onCleanup,
    onMount,
    Show,
    type JSX,
    type Component,
    type Accessor,
} from 'solid-js';
import { useLayer, WindowControls } from '@zylem/ui/components';
import { DockMenu } from './DockMenu';
import { PANEL_RANK } from './layer-ranks';
import { createPanelDocking, DockPreviewOverlay, type ResizeMode } from './panel-docking';
import { isHorizontalSide, type DockSide } from './dock-layout';
import { MAIN_PANEL_ID } from '../editor-store';

// Minimum drag threshold to distinguish from clicks
const DRAG_THRESHOLD = 3;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

/** An imperative dock command; the nonce lets the same side be re-sent. */
export interface DockRequest {
    side: DockSide | null;
    nonce: number;
}

export interface FloatingPanelProps {
    title?: string;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    /**
     * Size the panel should restore to when it floats. `initialSize` can be a
     * docked rect when the panel mounts docked, so it must not seed the
     * floating-size memory.
     */
    floatingSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    collapsible?: boolean;
    onClose?: () => void;
    onMove?: (position: { x: number; y: number }) => void;
    onResize?: (size: { width: number; height: number }) => void;
    dockRequest?: Accessor<DockRequest | null>;
    children: JSX.Element | ((isCollapsed: Accessor<boolean>) => JSX.Element);
}

/**
 * FloatingPanel - A draggable and resizable container component.
 * Can be moved by dragging the title bar and resized from edges/corners.
 * Dragging it past a viewport edge docks it; see `panel-docking`.
 */
export const FloatingPanel: Component<FloatingPanelProps> = (props) => {
    const layer = useLayer('panel', PANEL_RANK.mainPanel);
    const minSize = props.minSize ?? { width: 300, height: 200 };
    const initialPanelSize = props.initialSize ?? { width: 460, height: 600 };

    const [position, setPosition] = createSignal(
        props.initialPosition ?? { x: 50, y: 50 }
    );
    const [size, setSize] = createSignal(
        initialPanelSize
    );
    const [isCollapsed, setIsCollapsed] = createSignal(false);

    const toggleCollapse = () => setIsCollapsed(!isCollapsed());

    let isDragging = false;
    let isResizing = false;
    let resizeMode: ResizeMode = 'free';
    let resizeDirection: ResizeDirection = null;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let panelStartSize = { width: 0, height: 0 };
    let startThickness = 0;
    let hasMoved = false;
    let panelRef: HTMLDivElement | undefined;

    const {
        dockedSide,
        isAutoHeight,
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
        beginResize,
        resizeDockThickness,
        applyDockPreview,
        dockTo,
    } = createPanelDocking({
        panelId: MAIN_PANEL_ID,
        initialSize: props.floatingSize ?? initialPanelSize,
        minSize,
        position,
        setPosition,
        size,
        setSize,
        panelRef: () => panelRef,
        onPositionCommit: (nextPosition) => props.onMove?.(nextPosition),
        onSizeCommit: (nextSize) => props.onResize?.(nextSize),
    });

    // Host-driven dock commands (toolbar buttons, postMessage from a shell).
    createEffect(() => {
        const request = props.dockRequest?.();
        if (!request) return;
        dockTo(request.side);
    });

    // Clamp position to keep panel visible in viewport
    const clampPosition = (x: number, y: number, width: number, height: number) => {
        const padding = 50; // Keep at least this much visible
        return {
            x: Math.max(-width + padding, Math.min(x, window.innerWidth - padding)),
            y: Math.max(0, Math.min(y, window.innerHeight - padding)),
        };
    };

    // Clamp size to minimum and viewport bounds
    const clampSize = (width: number, height: number) => clampSizeToViewport(width, height);

    const handleTitleBarPointerDown = (e: PointerEvent) => {
        isDragging = true;
        hasMoved = false;
        hideDockPreview();
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        
        // Prevent default on mouse to avoid selection, but allow touch actions if needed
        // though touch-action: none handles the scrolling prevention
        if (e.pointerType === 'mouse') {
            e.preventDefault();
        }
    };

    const handleResizePointerDown = (direction: ResizeDirection) => (e: PointerEvent) => {
        isResizing = true;
        resizeDirection = direction;
        const side = dockedSide();
        const { size: currentSize, mode } = beginResize(direction);
        resizeMode = mode;
        // A thickness resize measures from the zone's current extent, not the
        // panel box, since every panel in the zone shares it.
        startThickness = side && isHorizontalSide(side) ? currentSize.width : currentSize.height;
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        panelStartSize = { ...currentSize };
        
        if (e.pointerType === 'mouse') {
            e.preventDefault();
        }
        e.stopPropagation();
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (isDragging) {
            let deltaX = e.clientX - dragStartPos.x;
            let deltaY = e.clientY - dragStartPos.y;

            if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
                if (!hasMoved) {
                    hasMoved = true;
                    // Every move happens through the small ghost, docked or not.
                    const fitted = beginDragGhost(e.clientX, e.clientY);
                    dragStartPos = { x: e.clientX, y: e.clientY };
                    panelStartPos = { ...fitted.position };
                    panelStartSize = { ...fitted.size };
                    deltaX = 0;
                    deltaY = 0;
                }
            }

            if (hasMoved) {
                const proposedX = panelStartPos.x + deltaX;
                const proposedY = panelStartPos.y + deltaY;
                const liveSize = getLiveSize();

                const dockSide = detectDockSide(
                    proposedX,
                    proposedY,
                    liveSize.width,
                    liveSize.height,
                );
                if (dockSide) {
                    showDockPreview(dockSide, detectDockIndex(dockSide, e.clientX, e.clientY));
                } else {
                    hideDockPreview();
                }

                const newPos = clampPosition(
                    proposedX,
                    proposedY,
                    liveSize.width,
                    liveSize.height
                );
                setPosition(newPos);
            }
        } else if (isResizing && resizeDirection) {
            const deltaX = e.clientX - dragStartPos.x;
            const deltaY = e.clientY - dragStartPos.y;

            // While docked, the only free dimension is the zone's thickness;
            // position and cross-axis extent come from the dock layout.
            if (resizeMode === 'thickness') {
                resizeDockThickness(startThickness, deltaX, deltaY);
                return;
            }

            let newWidth = panelStartSize.width;
            let newHeight = panelStartSize.height;
            let newX = panelStartPos.x;
            let newY = panelStartPos.y;

            // Handle horizontal resizing
            if (resizeDirection.includes('e')) {
                newWidth = panelStartSize.width + deltaX;
            } else if (resizeDirection.includes('w')) {
                newWidth = panelStartSize.width - deltaX;
                newX = panelStartPos.x + deltaX;
            }

            // Handle vertical resizing
            if (resizeDirection.includes('s')) {
                newHeight = panelStartSize.height + deltaY;
            } else if (resizeDirection.includes('n')) {
                newHeight = panelStartSize.height - deltaY;
                newY = panelStartPos.y + deltaY;
            }

            // Apply minimum size constraints
            const clampedSize = clampSize(newWidth, newHeight);

            // Adjust position if we hit minimum size when resizing from top/left
            if (resizeDirection.includes('w') && clampedSize.width === minSize.width) {
                newX = panelStartPos.x + panelStartSize.width - minSize.width;
            }
            if (resizeDirection.includes('n') && clampedSize.height === minSize.height) {
                newY = panelStartPos.y + panelStartSize.height - minSize.height;
            }

            setSize(clampedSize);
            setPosition(clampPosition(newX, newY, clampedSize.width, clampedSize.height));
        }
    };

    const handlePointerUp = () => {
        if (isDragging && hasMoved) {
            if (applyDockPreview()) {
                // Docking state and callbacks are handled by the shared controller.
            } else {
                // Drop the ghost: restores the pre-drag size and commits
                // position/size through the controller callbacks.
                endDragGhost();
            }
        }

        // A thickness resize keeps the panel docked; its extent already lives in
        // the registry, so only a free resize reports a floating size.
        if (isResizing && resizeMode === 'free') {
            rememberUndockedSize(size());
            props.onResize?.(size());
        }

        isDragging = false;
        isResizing = false;
        resizeMode = 'free';
        resizeDirection = null;
        hasMoved = false;
        hideDockPreview();
    };

    onMount(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    });

    onCleanup(() => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    });

    const resizeHandleStyle = (cursor: string): JSX.CSSProperties => ({
        position: 'absolute',
        'z-index': 10,
        cursor,
        'touch-action': 'none',
    });

    return (
        <div
            class="floating-panel"
            ref={panelRef}
            style={{
                position: 'fixed',
                left: `${position().x}px`,
                top: `${position().y}px`,
                width: `${size().width}px`,
                height:
                    !isMoving() && (isCollapsed() || isAutoHeight())
                        ? 'auto'
                        : `${size().height}px`,
                'z-index': layer.zIndex(),
                display: 'flex',
                'flex-direction': 'column',
                'border-radius': dockedSide() ? '0' : undefined,
                // The editor overlay root is pointer-events: none; re-enable
                // interaction for the panel itself.
                'pointer-events': 'auto',
                // While being moved the panel is just a transparent outline.
                ...(isMoving()
                    ? {
                        background: 'transparent',
                        'backdrop-filter': 'none',
                        '-webkit-backdrop-filter': 'none',
                        'box-shadow': 'none',
                        border: '2px solid var(--zylem-color-primary, #61a6e8)',
                    }
                    : {}),
            }}
        >
            <DockPreviewOverlay
                rect={getDockPreviewRect()}
                rank={PANEL_RANK.mainDockPreview}
            />

            {/* Title bar */}
            <div
                class="floating-panel-titlebar"
                style={{
                    cursor: 'grab',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'user-select': 'none',
                    'touch-action': 'none',
                    'border-radius': dockedSide() ? '0' : undefined,
                    visibility: isMoving() ? 'hidden' : undefined,
                }}
                onPointerDown={handleTitleBarPointerDown}
            >
                <span class="floating-panel-title">{props.title ?? 'Panel'}</span>
                <div style={{ display: 'flex', 'align-items': 'center', gap: '7px' }}>
                    <DockMenu dockedSide={dockedSide} onDock={(side) => dockTo(side)} />
                    <WindowControls
                        collapsed={isCollapsed()}
                        onCollapse={props.collapsible ? toggleCollapse : undefined}
                        onClose={props.onClose}
                        closeTestId="floating-panel-close"
                    />
                </div>
            </div>

            {/* Content area */}
            <div
                class="floating-panel-content"
                style={{
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    'flex-direction': 'column',
                    visibility: isMoving() ? 'hidden' : undefined,
                }}
            >
                {typeof props.children === 'function'
                    ? props.children(isCollapsed)
                    : props.children}
            </div>

            {/* Resize handles - edges */}
            <div
                style={{ ...resizeHandleStyle('ns-resize'), top: 0, left: '10px', right: '10px', height: '6px' }}
                onPointerDown={handleResizePointerDown('n')}
            />
            <div
                style={{ ...resizeHandleStyle('ns-resize'), bottom: 0, left: '10px', right: '10px', height: '6px' }}
                onPointerDown={handleResizePointerDown('s')}
            />
            <div
                style={{ ...resizeHandleStyle('ew-resize'), left: 0, top: '10px', bottom: '10px', width: '6px' }}
                onPointerDown={handleResizePointerDown('w')}
            />
            <div
                style={{ ...resizeHandleStyle('ew-resize'), right: 0, top: '10px', bottom: '10px', width: '6px' }}
                onPointerDown={handleResizePointerDown('e')}
            />

            {/* Resize handles - corners */}
            <div
                style={{ ...resizeHandleStyle('nwse-resize'), top: 0, left: 0, width: '10px', height: '10px' }}
                onPointerDown={handleResizePointerDown('nw')}
            />
            <div
                style={{ ...resizeHandleStyle('nesw-resize'), top: 0, right: 0, width: '10px', height: '10px' }}
                onPointerDown={handleResizePointerDown('ne')}
            />
            <div
                style={{ ...resizeHandleStyle('nesw-resize'), bottom: 0, left: 0, width: '10px', height: '10px' }}
                onPointerDown={handleResizePointerDown('sw')}
            />
            <div
                style={{ ...resizeHandleStyle('nwse-resize'), bottom: 0, right: 0, width: '10px', height: '10px' }}
                onPointerDown={handleResizePointerDown('se')}
            />
        </div>
    );
};
