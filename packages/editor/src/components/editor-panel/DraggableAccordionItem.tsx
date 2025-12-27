/**
 * DraggableAccordionItem - Wrapper for accordion items that enables drag-to-detach and reorder.
 * 
 * - Drag outside the menu panel → detaches into floating window
 * - Drag within the menu panel → reorders in the accordion
 * A ghost outline follows the cursor during drag.
 */

import { Accordion } from '@kobalte/core';
import { createSignal, onCleanup, onMount, Show, type Component, type JSX } from 'solid-js';
import { Portal } from 'solid-js/web';
import {
    detachPanel,
    debugStore,
    setDraggingPanel,
    setDropTargetIndex,
    clearDragState,
    reorderPanels,
} from '../editor-store';

// Minimum drag distance before showing ghost
const DRAG_THRESHOLD = 5;

export interface DraggableAccordionItemProps {
    value: string;
    title: string;
    children: JSX.Element;
}

export const DraggableAccordionItem: Component<DraggableAccordionItemProps> = (props) => {
    let itemRef: HTMLDivElement | undefined;
    let headerRef: HTMLDivElement | undefined;
    let menuPanelRef: HTMLElement | null = null;

    const [isDragging, setIsDragging] = createSignal(false);
    const [ghostPos, setGhostPos] = createSignal({ x: 0, y: 0 });
    const [headerSize, setHeaderSize] = createSignal({ width: 0, height: 0 });

    let dragStartPos = { x: 0, y: 0 };
    let isMouseDown = false;

    // Get current index of this panel in the order
    const getCurrentIndex = () => {
        const detachedIds = Object.keys(debugStore.detachedPanels);
        const dockedPanels = debugStore.panelOrder.filter((id) => !detachedIds.includes(id));
        return dockedPanels.indexOf(props.value);
    };

    const handleMouseDown = (e: MouseEvent) => {
        // Only start drag on left click
        if (e.button !== 0) return;

        isMouseDown = true;
        dragStartPos = { x: e.clientX, y: e.clientY };

        // Find the menu panel parent for bounds checking
        menuPanelRef = itemRef?.closest('.floating-panel') as HTMLElement | null;

        // Capture header size for ghost
        if (headerRef) {
            const rect = headerRef.getBoundingClientRect();
            setHeaderSize({ width: rect.width, height: rect.height });
        }

        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isMouseDown) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Start showing ghost after small movement
        if (distance > DRAG_THRESHOLD && !isDragging()) {
            setIsDragging(true);
            setDraggingPanel(props.value);
        }

        if (isDragging()) {
            // Update ghost position to follow cursor
            setGhostPos({
                x: e.clientX - headerSize().width / 2,
                y: e.clientY - 15,
            });

            // Check if over the accordion and determine drop index
            if (menuPanelRef) {
                const panelRect = menuPanelRef.getBoundingClientRect();
                const isInsidePanel =
                    e.clientX >= panelRect.left &&
                    e.clientX <= panelRect.right &&
                    e.clientY >= panelRect.top &&
                    e.clientY <= panelRect.bottom;

                if (isInsidePanel) {
                    // Find accordion and calculate drop index
                    const accordion = menuPanelRef.querySelector('.zylem-accordion');
                    if (accordion) {
                        const accordionItems = accordion.querySelectorAll('.accordion-item');
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
                    }
                } else {
                    setDropTargetIndex(null);
                }
            }
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        if (!isMouseDown) return;

        const wasDragging = isDragging();
        isMouseDown = false;
        setIsDragging(false);

        if (wasDragging && menuPanelRef) {
            // Check if cursor is outside the menu panel
            const panelRect = menuPanelRef.getBoundingClientRect();
            const isOutside =
                e.clientX < panelRect.left ||
                e.clientX > panelRect.right ||
                e.clientY < panelRect.top ||
                e.clientY > panelRect.bottom;

            if (isOutside) {
                // Detach the panel at the current mouse position
                detachPanel(props.value, {
                    x: e.clientX - 175,
                    y: e.clientY - 20,
                });
            } else {
                // Reorder within the panel
                const dropIndex = debugStore.dropTargetIndex;
                if (dropIndex !== null) {
                    const currentIndex = getCurrentIndex();
                    if (dropIndex !== currentIndex && dropIndex !== currentIndex + 1) {
                        // Calculate new order
                        const detachedIds = Object.keys(debugStore.detachedPanels);
                        const dockedPanels = debugStore.panelOrder.filter((id) => !detachedIds.includes(id));

                        // Remove current item
                        const newOrder = dockedPanels.filter((id) => id !== props.value);

                        // Adjust insert index if we're moving down
                        let insertIndex = dropIndex;
                        if (dropIndex > currentIndex) {
                            insertIndex = dropIndex - 1;
                        }

                        // Insert at new position
                        newOrder.splice(insertIndex, 0, props.value);

                        // Update store with full panel order (including detached)
                        const fullOrder = [...newOrder];
                        // Add back detached panels at their original positions
                        debugStore.panelOrder.forEach((id) => {
                            if (detachedIds.includes(id) && !fullOrder.includes(id)) {
                                fullOrder.push(id);
                            }
                        });

                        reorderPanels(fullOrder);
                    }
                }
            }
        }

        clearDragState();
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
        <>
            <Accordion.Item
                ref={itemRef}
                value={props.value}
                class={`accordion-item ${isDragging() ? 'accordion-item--dragging' : ''}`}
            >
                <Accordion.Header
                    ref={headerRef}
                    class="accordion-header"
                    onMouseDown={handleMouseDown}
                >
                    <Accordion.Trigger class="accordion-trigger zylem-exo-2">
                        {props.title}
                    </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content class="accordion-content scrollable-y scroll-thin">
                    {props.children}
                </Accordion.Content>
            </Accordion.Item>

            {/* Ghost outline that follows cursor during drag - rendered via portal to escape clipping */}
            <Show when={isDragging()}>
                <Portal>
                    <div
                        class="accordion-drag-ghost"
                        style={{
                            position: 'fixed',
                            left: `${ghostPos().x}px`,
                            top: `${ghostPos().y}px`,
                            width: `${headerSize().width}px`,
                            height: `${headerSize().height}px`,
                            'z-index': 9999,
                            'pointer-events': 'none',
                            display: 'flex',
                            'align-items': 'center',
                            'justify-content': 'space-between',
                            background: 'rgba(10, 20, 30, 0.54)',
                            border: '2px dotted #E64534',
                            'border-radius': '12px',
                            color: '#61A6E8',
                            'font-family': "'Exo 2', sans-serif",
                            'backdrop-filter': 'blur(8px)',
                            'box-shadow': '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px #E64534',
                        }}
                    >
                        <span
                            class="accordion-trigger zylem-exo-2"
                            style={{
                                'font-family': "'Exo 2', sans-serif",
                                'font-weight': 400,
                                padding: '8px 12px',
                            }}
                        >
                            {props.title}
                        </span>
                    </div>
                </Portal>
            </Show>
        </>
    );
};
