import { ToolbarButton as UIToolbarButton } from '@zylem/ui/components';
import type { Component, JSX } from 'solid-js';

export interface ToolbarButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    children: JSX.Element;
}

/**
 * Editor toolbar button — thin wrapper over the @zylem/ui HyperGlass
 * ToolbarButton (square glass icon button with tooltip).
 */
export const ToolbarButton: Component<ToolbarButtonProps> = (props) => {
    return (
        <UIToolbarButton
            label={props.label}
            selected={props.isSelected}
            onClick={() => props.onClick()}
        >
            {props.children}
        </UIToolbarButton>
    );
};
