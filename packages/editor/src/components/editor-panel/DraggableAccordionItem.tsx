/**
 * DraggableAccordionItem - Wrapper for accordion items that enables drag-to-detach.
 * 
 * When the user drags the header beyond a threshold, the panel detaches
 * into its own floating window.
 */

import { Accordion } from '@kobalte/core';
import { onCleanup, onMount, type Component, type JSX } from 'solid-js';
import { detachPanel } from '../editor-store';

// Distance in pixels to drag before detaching
const DETACH_THRESHOLD = 60;

export interface DraggableAccordionItemProps {
    value: string;
    title: string;
    children: JSX.Element;
}

export const DraggableAccordionItem: Component<DraggableAccordionItemProps> = (props) => {
    let headerRef: HTMLDivElement | undefined;
    let isDragging = false;
    let dragStartPos = { x: 0, y: 0 };
    let hasMoved = false;

    const handleMouseDown = (e: MouseEvent) => {
        // Only start drag on left click
        if (e.button !== 0) return;

        isDragging = true;
        hasMoved = false;
        dragStartPos = { x: e.clientX, y: e.clientY };

        // Prevent accordion toggle when starting drag
        // We'll allow it if they don't drag far enough
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartPos.x;
        const deltaY = e.clientY - dragStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > DETACH_THRESHOLD) {
            hasMoved = true;
            isDragging = false;

            // Detach the panel at the current mouse position
            detachPanel(props.value, {
                x: e.clientX - 175, // Center the panel roughly
                y: e.clientY - 20,
            });
        }
    };

    const handleMouseUp = () => {
        isDragging = false;
        // If they didn't move far enough, the accordion will toggle normally
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
        <Accordion.Item value={props.value} class="accordion-item">
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
    );
};
