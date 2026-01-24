import { createSignal, onCleanup, onMount, type Component } from 'solid-js';
import { setToggleButtonPosition } from '.';

// Corner snap threshold in pixels
const SNAP_THRESHOLD = 50;
// Minimum movement to consider as drag (not click)
const DRAG_THRESHOLD = 5;
// Button size matches --zylem-size-icon-lg in CSS
const BUTTON_SIZE = 96;

interface EditorToggleButtonProps {
    onToggle: () => void;
}

/**
 * Draggable toggle button for the editor panel.
 * Supports click to toggle and drag to reposition.
 * Snaps to corners when released near edges.
 */
export const EditorToggleButton: Component<EditorToggleButtonProps> = (props) => {
    // Initial position will be set on mount to top-right corner
    const [position, setPosition] = createSignal({ x: 0, y: 0 });

    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let buttonStartPos = { x: 0, y: 0 };
    let hasMoved = false;

    const snapToCorner = (x: number, y: number) => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let snappedX = x;
        let snappedY = y;

        // Snap to left edge
        if (x < SNAP_THRESHOLD) {
            snappedX = 20;
        }
        // Snap to right edge
        else if (x > windowWidth - BUTTON_SIZE - SNAP_THRESHOLD) {
            snappedX = windowWidth - BUTTON_SIZE - 20;
        }

        // Snap to top edge
        if (y < SNAP_THRESHOLD) {
            snappedY = 20;
        }
        // Snap to bottom edge
        else if (y > windowHeight - BUTTON_SIZE - SNAP_THRESHOLD) {
            snappedY = windowHeight - BUTTON_SIZE - 20;
        }

        return { x: snappedX, y: snappedY };
    };

    const handlePointerDown = (e: PointerEvent) => {
        isDragging = true;
        hasMoved = false;
        dragStartPos = { x: e.clientX, y: e.clientY };
        buttonStartPos = { ...position() };
        
        // Prevent default on mouse to avoid selection, but allow touch actions if needed
        // though touch-action: none handles the scrolling prevention
        if (e.pointerType === 'mouse') {
            e.preventDefault();
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;

        // Check if we've moved enough to consider it a drag
        if (Math.abs(deltaX) > DRAG_THRESHOLD || Math.abs(deltaY) > DRAG_THRESHOLD) {
            hasMoved = true;
        }

        if (hasMoved) {
            const newX = buttonStartPos.x + deltaX;
            const newY = buttonStartPos.y + deltaY;

            // Clamp to window bounds
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            const clampedX = Math.max(0, Math.min(newX, windowWidth - BUTTON_SIZE));
            const clampedY = Math.max(0, Math.min(newY, windowHeight - BUTTON_SIZE));

            setPosition({ x: clampedX, y: clampedY });
        }
    };

    const handlePointerUp = () => {
        if (isDragging) {
            if (hasMoved) {
                // Snap to corner on release
                const currentPos = position();
                const snappedPos = snapToCorner(currentPos.x, currentPos.y);
                setPosition(snappedPos);
                setToggleButtonPosition(snappedPos);
            } else {
                // It was a click, not a drag
                props.onToggle();
            }
            isDragging = false;
            hasMoved = false;
        }
    };

    onMount(() => {
        // Set initial position to top-right corner
        const initialX = window.innerWidth - BUTTON_SIZE - 20;
        const initialY = 20;
        const initialPos = { x: initialX, y: initialY };
        setPosition(initialPos);
        setToggleButtonPosition(initialPos);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    });

    onCleanup(() => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    });

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position().x}px`,
                top: `${position().y}px`,
                'z-index': 1001,
                cursor: 'grab',
                'touch-action': 'none'
            }}
        >
            <button
                id="zylem-editor-toggle"
                type="button"
                onPointerDown={handlePointerDown}
            />
        </div>
    );
};
