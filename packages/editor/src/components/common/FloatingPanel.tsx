import { createSignal, onCleanup, onMount, Show, type JSX, type Component, type Accessor } from 'solid-js';
import { Portal } from 'solid-js/web';
import PanelBottomOpen from 'lucide-solid/icons/panel-bottom-open';
import PanelBottomClose from 'lucide-solid/icons/panel-bottom-close';
import X from 'lucide-solid/icons/x';

// Minimum drag threshold to distinguish from clicks
const DRAG_THRESHOLD = 3;
const SNAP_PREVIEW_THRESHOLD = 24;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;
type DockSide = 'left' | 'right';

interface DockRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DockPreviewState {
    visible: boolean;
    side: DockSide | null;
}

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
    const [undockedSize, setUndockedSize] = createSignal(initialPanelSize);
    const [isAutoHeight, setIsAutoHeight] = createSignal(true);
    const [isCollapsed, setIsCollapsed] = createSignal(false);
    const [dockedSide, setDockedSide] = createSignal<DockSide | null>(null);
    const [dockPreview, setDockPreview] = createSignal<DockPreviewState>({
        visible: false,
        side: null,
    });

    const toggleCollapse = () => setIsCollapsed(!isCollapsed());

    let isDragging = false;
    let isResizing = false;
    let resizeDirection: ResizeDirection = null;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let panelStartSize = { width: 0, height: 0 };
    let hasMoved = false;
    let resizeRaf: number | undefined;
    let panelRef: HTMLDivElement | undefined;

    // Clamp position to keep panel visible in viewport
    const clampPosition = (x: number, y: number, width: number, height: number) => {
        const padding = 50; // Keep at least this much visible
        return {
            x: Math.max(-width + padding, Math.min(x, window.innerWidth - padding)),
            y: Math.max(0, Math.min(y, window.innerHeight - padding)),
        };
    };

    const clampSizeToViewport = (width: number, height: number) => {
        const maxWidth = Math.max(1, window.innerWidth);
        const maxHeight = Math.max(1, window.innerHeight);
        const minWidth = Math.min(minSize.width, maxWidth);
        const minHeight = Math.min(minSize.height, maxHeight);
        return {
            width: Math.min(maxWidth, Math.max(minWidth, width)),
            height: Math.min(maxHeight, Math.max(minHeight, height)),
        };
    };

    // Clamp size to minimum and viewport bounds
    const clampSize = (width: number, height: number) => clampSizeToViewport(width, height);

    const showDockPreview = (side: DockSide) => {
        setDockPreview({ visible: true, side });
    };

    const hideDockPreview = () => {
        setDockPreview({ visible: false, side: null });
    };

    const rememberUndockedSize = (nextSize: { width: number; height: number }) => {
        setUndockedSize({ width: nextSize.width, height: nextSize.height });
    };

    const getLiveSize = () => {
        if (panelRef) {
            const rect = panelRef.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        }
        return size();
    };

    const getDockRect = (side: DockSide): DockRect => {
        const quarterWidth = Math.max(1, Math.round(window.innerWidth / 4));

        switch (side) {
            case 'left':
                return { x: 0, y: 0, width: quarterWidth, height: window.innerHeight };
            case 'right':
                return {
                    x: Math.max(0, window.innerWidth - quarterWidth),
                    y: 0,
                    width: quarterWidth,
                    height: window.innerHeight,
                };
        }
    };

    const getDockPreviewRect = (): DockRect | null => {
        const preview = dockPreview();
        if (!preview.visible || !preview.side) return null;
        return getDockRect(preview.side);
    };

    const fitPanelToViewport = (
        currentX: number,
        currentY: number,
        currentWidth: number,
        currentHeight: number,
    ) => {
        const fittedSize = clampSizeToViewport(currentWidth, currentHeight);
        const maxX = Math.max(0, window.innerWidth - fittedSize.width);
        const maxY = Math.max(0, window.innerHeight - fittedSize.height);
        return {
            position: {
                x: Math.max(0, Math.min(currentX, maxX)),
                y: Math.max(0, Math.min(currentY, maxY)),
            },
            size: fittedSize,
        };
    };

    const detectDockSide = (
        x: number,
        y: number,
        width: number,
        height: number,
    ): DockSide | null => {
        const leftOverflow = Math.max(0, -x);
        const rightOverflow = Math.max(0, x + width - window.innerWidth);
        const topOverflow = Math.max(0, -y);
        const bottomOverflow = Math.max(0, y + height - window.innerHeight);

        // Direct side docking when dragging off left/right edges.
        if (leftOverflow >= SNAP_PREVIEW_THRESHOLD || rightOverflow >= SNAP_PREVIEW_THRESHOLD) {
            return leftOverflow >= rightOverflow ? 'left' : 'right';
        }

        // No horizontal docking mode for top/bottom; route to nearest side instead.
        if (topOverflow >= SNAP_PREVIEW_THRESHOLD || bottomOverflow >= SNAP_PREVIEW_THRESHOLD) {
            const panelCenterX = x + width / 2;
            return panelCenterX <= window.innerWidth / 2 ? 'left' : 'right';
        }

        return null;
    };

    const undockFromDrag = (pointerX: number, pointerY: number) => {
        const preferred = undockedSize();
        const restored = clampSizeToViewport(preferred.width, preferred.height);
        const currentPos = position();
        const pointerOffsetX = pointerX - currentPos.x;
        const pointerOffsetY = pointerY - currentPos.y;
        const fitted = fitPanelToViewport(
            pointerX - pointerOffsetX,
            pointerY - pointerOffsetY,
            restored.width,
            restored.height,
        );

        setSize(fitted.size);
        setPosition(fitted.position);
        setDockedSide(null);
        setIsAutoHeight(true);
        hideDockPreview();

        dragStartPos = { x: pointerX, y: pointerY };
        panelStartPos = { ...fitted.position };
        panelStartSize = { ...fitted.size };
    };

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
        hideDockPreview();
        setDockedSide(null);
        setIsAutoHeight(false);
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        panelStartSize = { ...size() };
        
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
                        undockFromDrag(e.clientX, e.clientY);
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
            const previewRect = getDockPreviewRect();
            if (previewRect) {
                if (!wasDocked) {
                    rememberUndockedSize(size());
                }
                const snappedRect = previewRect;
                setPosition({ x: snappedRect.x, y: snappedRect.y });
                setSize({ width: snappedRect.width, height: snappedRect.height });
                setDockedSide(dockPreview().side);
                setIsAutoHeight(false);
                props.onMove?.({ x: snappedRect.x, y: snappedRect.y });
            } else {
                if (wasDocked) {
                    const preferred = undockedSize();
                    const restored = clampSizeToViewport(preferred.width, preferred.height);
                    const currentPos = position();
                    const fitted = fitPanelToViewport(
                        currentPos.x,
                        currentPos.y,
                        restored.width,
                        restored.height,
                    );
                    setSize(fitted.size);
                    setPosition(fitted.position);
                    props.onMove?.(fitted.position);
                    setIsAutoHeight(true);
                } else {
                    // Notify parent of new position
                    props.onMove?.(position());
                }
                setDockedSide(null);
            }
        }

        if (isResizing) {
            setDockedSide(null);
            rememberUndockedSize(size());
        }

        isDragging = false;
        isResizing = false;
        resizeDirection = null;
        hasMoved = false;
        hideDockPreview();
    };

    const handleWindowResize = () => {
        if (resizeRaf !== undefined) {
            cancelAnimationFrame(resizeRaf);
        }
        resizeRaf = requestAnimationFrame(() => {
            const side = dockedSide();
            if (side) {
                const dockRect = getDockRect(side);
                const currentPos = position();
                const currentSize = size();
                if (
                    currentPos.x !== dockRect.x
                    || currentPos.y !== dockRect.y
                    || currentSize.width !== dockRect.width
                    || currentSize.height !== dockRect.height
                ) {
                    setPosition({ x: dockRect.x, y: dockRect.y });
                    setSize({ width: dockRect.width, height: dockRect.height });
                    props.onMove?.({ x: dockRect.x, y: dockRect.y });
                }
            } else {
                const currentPos = position();
                const currentSize = isAutoHeight() ? getLiveSize() : size();
                const fitted = fitPanelToViewport(
                    currentPos.x,
                    currentPos.y,
                    currentSize.width,
                    currentSize.height,
                );

                const sizeChanged =
                    currentSize.width !== fitted.size.width
                    || currentSize.height !== fitted.size.height;
                const posChanged =
                    currentPos.x !== fitted.position.x || currentPos.y !== fitted.position.y;

                if (sizeChanged) {
                    setSize(fitted.size);
                }
                if (posChanged) {
                    setPosition(fitted.position);
                    props.onMove?.(fitted.position);
                }
            }
            resizeRaf = undefined;
        });
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
        if (resizeRaf !== undefined) {
            cancelAnimationFrame(resizeRaf);
        }
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
            <Show when={getDockPreviewRect()}>
                {(previewRect) => (
                    <Portal>
                        <div
                            style={{
                                position: 'fixed',
                                left: `${previewRect().x}px`,
                                top: `${previewRect().y}px`,
                                width: `${previewRect().width}px`,
                                height: `${previewRect().height}px`,
                                'z-index': 1004,
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
