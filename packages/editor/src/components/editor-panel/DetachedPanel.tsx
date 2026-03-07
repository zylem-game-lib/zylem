/**
 * DetachedPanel - A floating panel for sections that have been detached from the accordion.
 * 
 * Features:
 * - Draggable title bar
 * - Resizable from edges and corners
 * - Z-index ordering (click to bring to front)
 * - Drag back over accordion to reattach at specific position
 * - Close button reattaches to accordion
 */

import { createSignal, onCleanup, onMount, Show, type Component, type JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
    reattachPanel,
    updateDetachedPanelPosition,
    updateDetachedPanelSize,
    debugStore,
    setDraggingPanel,
    setDropTargetIndex,
    clearDragState,
    bringPanelToFront,
} from '../editor-store';
import { getPanelTitle, renderPanelContent } from './panel-config';

// Minimum drag threshold to distinguish from clicks
const DRAG_THRESHOLD = 3;
const SNAP_PREVIEW_THRESHOLD = 24;
const MIN_WIDTH = 250;
const MIN_HEIGHT = 150;

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

export interface DetachedPanelProps {
    panelId: string;
}

export const DetachedPanel: Component<DetachedPanelProps> = (props) => {
    const panelState = () => debugStore.detachedPanels[props.panelId];
    const zIndex = () => {
        const index = debugStore.panelZOrder.indexOf(props.panelId);
        return 1003 + index;
    };
    const initialPanelSize = panelState()?.size ?? { width: 350, height: 300 };

    const [position, setPosition] = createSignal(
        panelState()?.position ?? { x: 100, y: 100 }
    );
    const [size, setSize] = createSignal(
        initialPanelSize
    );
    const [undockedSize, setUndockedSize] = createSignal(initialPanelSize);
    const [isAutoHeight, setIsAutoHeight] = createSignal(true);
    const [dockedSide, setDockedSide] = createSignal<DockSide | null>(null);
    const [dockPreview, setDockPreview] = createSignal<DockPreviewState>({
        visible: false,
        side: null,
    });

    let isDragging = false;
    let isResizing = false;
    let resizeDirection: ResizeDirection = null;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let panelStartSize = { width: 0, height: 0 };
    let hasMoved = false;
    let resizeRaf: number | undefined;
    let panelRef: HTMLDivElement | undefined;

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
        if (side === 'left') {
            return { x: 0, y: 0, width: quarterWidth, height: window.innerHeight };
        }
        return {
            x: Math.max(0, window.innerWidth - quarterWidth),
            y: 0,
            width: quarterWidth,
            height: window.innerHeight,
        };
    };

    const getDockPreviewRect = (): DockRect | null => {
        const preview = dockPreview();
        if (!preview.visible || !preview.side) return null;
        return getDockRect(preview.side);
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

        if (leftOverflow >= SNAP_PREVIEW_THRESHOLD || rightOverflow >= SNAP_PREVIEW_THRESHOLD) {
            return leftOverflow >= rightOverflow ? 'left' : 'right';
        }

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

    const clampSizeToViewport = (width: number, height: number) => {
        const maxWidth = Math.max(1, window.innerWidth);
        const maxHeight = Math.max(1, window.innerHeight);
        const minWidth = Math.min(MIN_WIDTH, maxWidth);
        const minHeight = Math.min(MIN_HEIGHT, maxHeight);
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

    const handlePanelPointerDown = () => {
        // Bring to front on any click/touch
        bringPanelToFront(props.panelId);
    };

    const handleTitleBarPointerDown = (e: PointerEvent) => {
        isDragging = true;
        hasMoved = false;
        hideDockPreview();
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        bringPanelToFront(props.panelId);
        
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
        bringPanelToFront(props.panelId);
        
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
                    setDraggingPanel(props.panelId);
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
                const currentSize = getLiveSize();
                const dockSide = detectDockSide(
                    proposedX,
                    proposedY,
                    currentSize.width,
                    currentSize.height,
                );

                if (dockSide) {
                    showDockPreview(dockSide);
                    setDropTargetIndex(null);
                } else {
                    hideDockPreview();
                }

                const newPos = {
                    x: Math.max(0, Math.min(proposedX, window.innerWidth - 100)),
                    y: Math.max(0, Math.min(proposedY, window.innerHeight - 50)),
                };
                setPosition(newPos);

                // Check if over the main editor panel and determine drop index
                if (!dockSide) {
                    const editorPanel = document.querySelector('.zylem-accordion');
                    if (editorPanel) {
                        const panelRect = editorPanel.getBoundingClientRect();
                        const isOverPanel =
                            e.clientX >= panelRect.left &&
                            e.clientX <= panelRect.right &&
                            e.clientY >= panelRect.top &&
                            e.clientY <= panelRect.bottom;

                        if (isOverPanel) {
                            const accordionItems = editorPanel.querySelectorAll('.accordion-item');
                            let dropIndex = 0;

                            for (let i = 0; i < accordionItems.length; i++) {
                                const item = accordionItems[i];
                                if (!item) continue;
                                const itemRect = item.getBoundingClientRect();
                                const itemMiddle = itemRect.top + itemRect.height / 2;
                                if (e.clientY > itemMiddle) {
                                    dropIndex = i + 1;
                                }
                            }
                            setDropTargetIndex(dropIndex);
                        } else {
                            setDropTargetIndex(null);
                        }
                    }
                }
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
                newWidth = Math.max(MIN_WIDTH, panelStartSize.width + deltaX);
            } else if (resizeDirection.includes('w')) {
                const proposedWidth = panelStartSize.width - deltaX;
                if (proposedWidth >= MIN_WIDTH) {
                    newWidth = proposedWidth;
                    newX = panelStartPos.x + deltaX;
                }
            }

            // Handle vertical resizing
            if (resizeDirection.includes('s')) {
                newHeight = Math.max(MIN_HEIGHT, panelStartSize.height + deltaY);
            } else if (resizeDirection.includes('n')) {
                const proposedHeight = panelStartSize.height - deltaY;
                if (proposedHeight >= MIN_HEIGHT) {
                    newHeight = proposedHeight;
                    newY = panelStartPos.y + deltaY;
                }
            }

            const clampedSize = clampSizeToViewport(newWidth, newHeight);
            const maxX = Math.max(0, window.innerWidth - clampedSize.width);
            const maxY = Math.max(0, window.innerHeight - clampedSize.height);
            setSize(clampedSize);
            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            });
        }
    };

    const handlePointerUp = () => {
        const wasDocked = dockedSide() !== null;

        if (isDragging && hasMoved) {
            const preview = dockPreview();
            if (preview.visible && preview.side) {
                if (!wasDocked) {
                    rememberUndockedSize(size());
                }
                const dockRect = getDockRect(preview.side);
                setPosition({ x: dockRect.x, y: dockRect.y });
                setSize({ width: dockRect.width, height: dockRect.height });
                setDockedSide(preview.side);
                setIsAutoHeight(false);
                updateDetachedPanelPosition(props.panelId, { x: dockRect.x, y: dockRect.y });
                updateDetachedPanelSize(props.panelId, { width: dockRect.width, height: dockRect.height });
            } else {
                const dropIndex = debugStore.dropTargetIndex;
                if (dropIndex !== null) {
                    reattachPanel(props.panelId, dropIndex);
                } else {
                    let nextPosition = position();
                    if (wasDocked) {
                        const preferred = undockedSize();
                        const restored = clampSizeToViewport(preferred.width, preferred.height);
                        const fitted = fitPanelToViewport(
                            nextPosition.x,
                            nextPosition.y,
                            restored.width,
                            restored.height,
                        );
                        setSize(fitted.size);
                        setPosition(fitted.position);
                        updateDetachedPanelSize(props.panelId, fitted.size);
                        nextPosition = fitted.position;
                        setIsAutoHeight(true);
                    }
                    updateDetachedPanelPosition(props.panelId, nextPosition);
                }
                setDockedSide(null);
            }
        }

        if (isResizing) {
            setDockedSide(null);
            rememberUndockedSize(size());
            updateDetachedPanelSize(props.panelId, size());
            updateDetachedPanelPosition(props.panelId, position());
        }

        isDragging = false;
        isResizing = false;
        resizeDirection = null;
        hasMoved = false;
        hideDockPreview();
        clearDragState();
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
                    updateDetachedPanelPosition(props.panelId, { x: dockRect.x, y: dockRect.y });
                    updateDetachedPanelSize(props.panelId, { width: dockRect.width, height: dockRect.height });
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
                    updateDetachedPanelSize(props.panelId, fitted.size);
                }
                if (posChanged) {
                    setPosition(fitted.position);
                    updateDetachedPanelPosition(props.panelId, fitted.position);
                }
            }

            resizeRaf = undefined;
        });
    };

    const handleClose = () => {
        reattachPanel(props.panelId);
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
            class="detached-panel floating-panel"
            ref={panelRef}
            onPointerDown={handlePanelPointerDown}
            style={{
                left: `${position().x}px`,
                top: `${position().y}px`,
                width: `${size().width}px`,
                height: isAutoHeight() ? 'auto' : `${size().height}px`,
                'z-index': zIndex(),
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
                                'z-index': zIndex() + 1,
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
                class="detached-panel-titlebar floating-panel-titlebar"
                onPointerDown={handleTitleBarPointerDown}
                style={{
                    "touch-action": "none",
                    'border-radius': dockedSide() ? '0' : undefined,
                }}
            >
                <span class="floating-panel-title">{getPanelTitle(props.panelId)}</span>
                <button
                    class="floating-panel-button zylem-button"
                    onClick={handleClose}
                    type="button"
                    title="Dock back to panel"
                >
                    ✕
                </button>
            </div>

            {/* Content area */}
            <div
                class="detached-panel-content floating-panel-content"
            >
                {renderPanelContent(props.panelId)}
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
