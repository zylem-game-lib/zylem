import MousePointer from 'lucide-solid/icons/mouse-pointer';
import type { Component } from 'solid-js';
import { setDebugTool, debugStore } from '..';
import { dispatchEditorUpdate } from '../editor-events';
import { ToolbarButton } from './ToolbarButton';

export const SelectButton: Component = () => {
    const handleClick = () => {
        const newTool = debugStore.tool === 'select' ? 'none' : 'select';
        setDebugTool(newTool);
        dispatchEditorUpdate({ toolbarState: { tool: newTool } });
    };

    return (
        <ToolbarButton
            label="Select"
            isSelected={debugStore.tool === 'select'}
            onClick={handleClick}
        >
            <MousePointer class="zylem-icon" />
        </ToolbarButton>
    );
};
