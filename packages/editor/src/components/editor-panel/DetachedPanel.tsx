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

import { createSignal, onCleanup, onMount, type Component, type JSX } from 'solid-js';
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
const MIN_WIDTH = 250;
const MIN_HEIGHT = 150;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export interface DetachedPanelProps {
    panelId: string;
}

export const DetachedPanel: Component<DetachedPanelProps> = (props) => {
    const panelState = () => debugStore.detachedPanels[props.panelId];
    const zIndex = () => {
        const index = debugStore.panelZOrder.indexOf(props.panelId);
        return 1003 + index;
    };

    const [position, setPosition] = createSignal(
        panelState()?.position ?? { x: 100, y: 100 }
    );
    const [size, setSize] = createSignal(
        panelState()?.size ?? { width: 350, height: 300 }
    );

    let isDragging = false;
    let isResizing = false;
    let resizeDirection: ResizeDirection = null;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let panelStartSize = { width: 0, height: 0 };
    let hasMoved = false;

    const handlePanelPointerDown = () => {
        // Bring to front on any click/touch
        bringPanelToFront(props.panelId);
    };

    const handleTitleBarPointerDown = (e: PointerEvent) => {
        isDragging = true;
        hasMoved = false;
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
            const deltaX = e.clientX - dragStartPos.x;
            const deltaY = e.clientY - dragStartPos.y;

            if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
                if (!hasMoved) {
                    hasMoved = true;
                    setDraggingPanel(props.panelId);
                }
            }

            if (hasMoved) {
                const newPos = {
                    x: Math.max(0, Math.min(panelStartPos.x + deltaX, window.innerWidth - 100)),
                    y: Math.max(0, Math.min(panelStartPos.y + deltaY, window.innerHeight - 50)),
                };
                setPosition(newPos);

                // Check if over the main editor panel and determine drop index
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

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        if (isDragging && hasMoved) {
            const dropIndex = debugStore.dropTargetIndex;
            if (dropIndex !== null) {
                reattachPanel(props.panelId, dropIndex);
            } else {
                updateDetachedPanelPosition(props.panelId, position());
            }
        }

        if (isResizing) {
            updateDetachedPanelSize(props.panelId, size());
            updateDetachedPanelPosition(props.panelId, position());
        }

        isDragging = false;
        isResizing = false;
        resizeDirection = null;
        hasMoved = false;
        clearDragState();
    };

    const handleClose = () => {
        reattachPanel(props.panelId);
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
            class="detached-panel floating-panel"
            onPointerDown={handlePanelPointerDown}
            style={{
                left: `${position().x}px`,
                top: `${position().y}px`,
                width: `${size().width}px`,
                height: `${size().height}px`,
                'z-index': zIndex(),
            }}
        >
            {/* Title bar */}
            <div
                class="detached-panel-titlebar floating-panel-titlebar"
                onPointerDown={handleTitleBarPointerDown}
                style={{ "touch-action": "none" }}
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
