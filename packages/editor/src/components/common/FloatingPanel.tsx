import { createSignal, onCleanup, onMount, Show, type JSX, type Component, type Accessor } from 'solid-js';
import PanelBottomOpen from 'lucide-solid/icons/panel-bottom-open';
import PanelBottomClose from 'lucide-solid/icons/panel-bottom-close';
import X from 'lucide-solid/icons/x';
import { createPanelDocking, DockPreviewOverlay } from './panel-docking';

// Minimum drag threshold to distinguish from clicks
const DRAG_THRESHOLD = 3;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export interface FloatingPanelProps {
    title?: string;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    collapsible?: boolean;
    onClose?: () => void;
    onMove?: (position: { x: number; y: number }) => void;
    children: JSX.Element | ((isCollapsed: Accessor<boolean>) => JSX.Element);
}

/**
 * FloatingPanel - A draggable and resizable container component.
 * Can be moved by dragging the title bar and resized from edges/corners.
 */
export const FloatingPanel: Component<FloatingPanelProps> = (props) => {
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
    let resizeDirection: ResizeDirection = null;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let panelStartSize = { width: 0, height: 0 };
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
        undockFromDrag,
        clampSizeToViewport,
        beginResize,
        clearDockedSide,
        applyDockPreview,
        restoreUndockedPanel,
        handleWindowResize,
        cleanupWindowResize,
    } = createPanelDocking({
        initialSize: initialPanelSize,
        minSize,
        position,
        setPosition,
        size,
        setSize,
        panelRef: () => panelRef,
        onPositionCommit: (nextPosition) => props.onMove?.(nextPosition),
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
        const currentSize = beginResize();
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
                    if (dockedSide() !== null) {
                        const fitted = undockFromDrag(e.clientX, e.clientY);
                        dragStartPos = { x: e.clientX, y: e.clientY };
                        panelStartPos = { ...fitted.position };
                        panelStartSize = { ...fitted.size };
                        deltaX = 0;
                        deltaY = 0;
                    }
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
                    showDockPreview(dockSide);
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
        const wasDocked = dockedSide() !== null;

        if (isDragging && hasMoved) {
            if (applyDockPreview()) {
                // Docking state and callbacks are handled by the shared controller.
            } else {
                if (wasDocked) {
                    restoreUndockedPanel();
                } else {
                    // Notify parent of new position
                    props.onMove?.(position());
                }
                clearDockedSide();
            }
        }

        if (isResizing) {
            clearDockedSide();
            rememberUndockedSize(size());
        }

        isDragging = false;
        isResizing = false;
        resizeDirection = null;
        hasMoved = false;
        hideDockPreview();
    };

    onMount(() => {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('resize', handleWindowResize);
    });

    onCleanup(() => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('resize', handleWindowResize);
        cleanupWindowResize();
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
                height: isCollapsed() || isAutoHeight() ? 'auto' : `${size().height}px`,
                'z-index': 1002,
                display: 'flex',
                'flex-direction': 'column',
                'border-radius': dockedSide() ? '0' : undefined,
            }}
        >
            <DockPreviewOverlay rect={getDockPreviewRect()} zIndex={1004} />

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
                }}
                onPointerDown={handleTitleBarPointerDown}
            >
                <span class="floating-panel-title">{props.title ?? 'Panel'}</span>
                <div class="floating-panel-controls">
                    <Show when={props.collapsible}>
                        <button
                            class="floating-panel-button"
                            onClick={toggleCollapse}
                            title={isCollapsed() ? 'Expand panel' : 'Collapse panel'}
                            type="button"
                        >
                            {isCollapsed() ? <PanelBottomOpen size={12} /> : <PanelBottomClose size={12} />}
                        </button>
                    </Show>
                    <Show when={props.onClose}>
                        <button
                            class="floating-panel-button"
                            onClick={props.onClose}
                            type="button"
                            aria-label="Close panel"
                            title="Close panel"
                            data-testid="floating-panel-close"
                        >
                            <X size={12} />
                        </button>
                    </Show>
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
