import Plus from 'lucide-solid/icons/plus';
import type { Component } from 'solid-js';
import { setDebugTool, debugStore } from '..';
import { sendTool } from '../../bridge/editor-bridge';
import { ToolbarButton } from './ToolbarButton';

export const AddButton: Component = () => {
    const handleClick = () => {
        const newTool = debugStore.tool === 'add' ? 'none' : 'add';
        setDebugTool(newTool);
        sendTool(newTool);
    };

    return (
        <ToolbarButton
            label="Add"
            isSelected={debugStore.tool === 'add'}
            onClick={handleClick}
        >
            <Plus class="zylem-icon" />
        </ToolbarButton>
    );
};
