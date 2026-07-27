import MousePointer from 'lucide-solid/icons/mouse-pointer';
import type { Component } from 'solid-js';
import { setDebugTool, debugStore } from '..';
import { sendTool } from '../../bridge/editor-bridge';
import { ToolbarButton } from './ToolbarButton';

export const SelectButton: Component = () => {
    const handleClick = () => {
        const newTool = debugStore.tool === 'select' ? 'none' : 'select';
        setDebugTool(newTool);
        sendTool(newTool);
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
