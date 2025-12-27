import { Button, Tooltip } from '@kobalte/core';
import type { Component, JSX } from 'solid-js';

export interface ToolbarButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    children: JSX.Element;
}

/**
 * Reusable toolbar button with tooltip.
 */
export const ToolbarButton: Component<ToolbarButtonProps> = (props) => {
    return (
        <Tooltip.Root>
            <Tooltip.Trigger>
                <Button.Root
                    aria-label={props.label}
                    onClick={props.onClick}
                    class={`zylem-toolbar-btn zylem-button ${props.isSelected ? 'selected' : ''}`}
                >
                    {props.children}
                </Button.Root>
            </Tooltip.Trigger>
            <Tooltip.Portal>
                <Tooltip.Content class="zylem-tooltip zylem-exo-2">
                    {props.label}
                </Tooltip.Content>
            </Tooltip.Portal>
        </Tooltip.Root>
    );
};
