/**
 * DetachedPanel - A floating panel for sections that have been detached from the accordion.
 * 
 * Features:
 * - Draggable title bar
 * - Resizable
 * - Close button reattaches to accordion
 * - Stores position in store
 */

import { createSignal, onCleanup, onMount, type Component, type JSX } from 'solid-js';
import { reattachPanel, updateDetachedPanelPosition, debugStore } from '../editor-store';
import { getPanelTitle, renderPanelContent } from './panel-config';

// Minimum drag threshold to distinguish from clicks
const DRAG_THRESHOLD = 3;

export interface DetachedPanelProps {
    panelId: string;
}

export const DetachedPanel: Component<DetachedPanelProps> = (props) => {
    const panelState = () => debugStore.detachedPanels[props.panelId];

    const [position, setPosition] = createSignal(
        panelState()?.position ?? { x: 100, y: 100 }
    );
    const [size, setSize] = createSignal(
        panelState()?.size ?? { width: 350, height: 300 }
    );

    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let hasMoved = false;

    const handleTitleBarMouseDown = (e: MouseEvent) => {
        isDragging = true;
        hasMoved = false;
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;

        if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
            hasMoved = true;
        }

        if (hasMoved) {
            const newPos = {
                x: Math.max(0, Math.min(panelStartPos.x + deltaX, window.innerWidth - 100)),
                y: Math.max(0, Math.min(panelStartPos.y + deltaY, window.innerHeight - 50)),
            };
            setPosition(newPos);
        }
    };

    const handleMouseUp = () => {
        if (isDragging && hasMoved) {
            // Save position to store
            updateDetachedPanelPosition(props.panelId, position());
        }
        isDragging = false;
        hasMoved = false;
    };

    const handleClose = () => {
        reattachPanel(props.panelId);
    };

    onMount(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    });

    onCleanup(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    });

    return (
        <div
            class="detached-panel floating-panel"
            style={{
                position: 'fixed',
                left: `${position().x}px`,
                top: `${position().y}px`,
                width: `${size().width}px`,
                height: `${size().height}px`,
                'z-index': 1003,
                display: 'flex',
                'flex-direction': 'column',
            }}
        >
            {/* Title bar */}
            <div
                class="detached-panel-titlebar floating-panel-titlebar"
                onMouseDown={handleTitleBarMouseDown}
                style={{
                    cursor: 'grab',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'user-select': 'none',
                }}
            >
                <span class="floating-panel-title">{getPanelTitle(props.panelId)}</span>
                <button
                    class="floating-panel-close zylem-button"
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
                style={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    'flex-direction': 'column',
                }}
            >
                {renderPanelContent(props.panelId)}
            </div>
        </div>
    );
};
