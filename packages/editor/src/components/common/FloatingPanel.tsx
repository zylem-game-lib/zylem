import { createSignal, onCleanup, onMount, type JSX, type Component } from 'solid-js';

// Minimum drag threshold to distinguish from clicks
const DRAG_THRESHOLD = 3;

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

export interface FloatingPanelProps {
    title?: string;
    initialPosition?: { x: number; y: number };
    initialSize?: { width: number; height: number };
    minSize?: { width: number; height: number };
    onClose?: () => void;
    onMove?: (position: { x: number; y: number }) => void;
    children: JSX.Element;
}

/**
 * FloatingPanel - A draggable and resizable container component.
 * Can be moved by dragging the title bar and resized from edges/corners.
 */
export const FloatingPanel: Component<FloatingPanelProps> = (props) => {
    const minSize = props.minSize ?? { width: 300, height: 200 };

    const [position, setPosition] = createSignal(
        props.initialPosition ?? { x: 50, y: 50 }
    );
    const [size, setSize] = createSignal(
        props.initialSize ?? { width: 460, height: 600 }
    );

    let isDragging = false;
    let isResizing = false;
    let resizeDirection: ResizeDirection = null;
    let dragStartPos = { x: 0, y: 0 };
    let panelStartPos = { x: 0, y: 0 };
    let panelStartSize = { width: 0, height: 0 };
    let hasMoved = false;

    // Clamp position to keep panel visible in viewport
    const clampPosition = (x: number, y: number, width: number, height: number) => {
        const padding = 50; // Keep at least this much visible
        return {
            x: Math.max(-width + padding, Math.min(x, window.innerWidth - padding)),
            y: Math.max(0, Math.min(y, window.innerHeight - padding)),
        };
    };

    // Clamp size to minimum
    const clampSize = (width: number, height: number) => ({
        width: Math.max(minSize.width, width),
        height: Math.max(minSize.height, height),
    });

    const handleTitleBarMouseDown = (e: MouseEvent) => {
        isDragging = true;
        hasMoved = false;
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        e.preventDefault();
    };

    const handleResizeMouseDown = (direction: ResizeDirection) => (e: MouseEvent) => {
        isResizing = true;
        resizeDirection = direction;
        dragStartPos = { x: e.clientX, y: e.clientY };
        panelStartPos = { ...position() };
        panelStartSize = { ...size() };
        e.preventDefault();
        e.stopPropagation();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const deltaX = e.clientX - dragStartPos.x;
            const deltaY = e.clientY - dragStartPos.y;

            if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
                hasMoved = true;
            }

            if (hasMoved) {
                const newPos = clampPosition(
                    panelStartPos.x + deltaX,
                    panelStartPos.y + deltaY,
                    size().width,
                    size().height
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

    const handleMouseUp = () => {
        if (isDragging && hasMoved) {
            // Notify parent of new position
            props.onMove?.(position());
        }
        isDragging = false;
        isResizing = false;
        resizeDirection = null;
        hasMoved = false;
    };

    onMount(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    });

    onCleanup(() => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    });

    const resizeHandleStyle = (cursor: string): JSX.CSSProperties => ({
        position: 'absolute',
        'z-index': 10,
        cursor,
    });

    return (
        <div
            class="floating-panel"
            style={{
                position: 'fixed',
                left: `${position().x}px`,
                top: `${position().y}px`,
                width: `${size().width}px`,
                height: `${size().height}px`,
                'z-index': 1002,
                display: 'flex',
                'flex-direction': 'column',
            }}
        >
            {/* Title bar */}
            <div
                class="floating-panel-titlebar"
                onMouseDown={handleTitleBarMouseDown}
                style={{
                    cursor: 'grab',
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'space-between',
                    'user-select': 'none',
                }}
            >
                <span class="floating-panel-title">{props.title ?? 'Panel'}</span>
                {props.onClose && (
                    <button
                        class="floating-panel-close zylem-button"
                        onClick={props.onClose}
                        type="button"
                    >
                        ✕
                    </button>
                )}
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
                {props.children}
            </div>

            {/* Resize handles - edges */}
            <div
                style={{ ...resizeHandleStyle('ns-resize'), top: 0, left: '10px', right: '10px', height: '6px' }}
                onMouseDown={handleResizeMouseDown('n')}
            />
            <div
                style={{ ...resizeHandleStyle('ns-resize'), bottom: 0, left: '10px', right: '10px', height: '6px' }}
                onMouseDown={handleResizeMouseDown('s')}
            />
            <div
                style={{ ...resizeHandleStyle('ew-resize'), left: 0, top: '10px', bottom: '10px', width: '6px' }}
                onMouseDown={handleResizeMouseDown('w')}
            />
            <div
                style={{ ...resizeHandleStyle('ew-resize'), right: 0, top: '10px', bottom: '10px', width: '6px' }}
                onMouseDown={handleResizeMouseDown('e')}
            />

            {/* Resize handles - corners */}
            <div
                style={{ ...resizeHandleStyle('nwse-resize'), top: 0, left: 0, width: '10px', height: '10px' }}
                onMouseDown={handleResizeMouseDown('nw')}
            />
            <div
                style={{ ...resizeHandleStyle('nesw-resize'), top: 0, right: 0, width: '10px', height: '10px' }}
                onMouseDown={handleResizeMouseDown('ne')}
            />
            <div
                style={{ ...resizeHandleStyle('nesw-resize'), bottom: 0, left: 0, width: '10px', height: '10px' }}
                onMouseDown={handleResizeMouseDown('sw')}
            />
            <div
                style={{ ...resizeHandleStyle('nwse-resize'), bottom: 0, right: 0, width: '10px', height: '10px' }}
                onMouseDown={handleResizeMouseDown('se')}
            />
        </div>
    );
};
