import Trash2 from 'lucide-solid/icons/trash-2';
import type { Component } from 'solid-js';
import { setDebugTool, debugStore } from '..';
import { dispatchEditorUpdate } from '../editor-events';
import { ToolbarButton } from './ToolbarButton';

export const DeleteButton: Component = () => {
    const handleClick = () => {
        const newTool = debugStore.tool === 'delete' ? 'none' : 'delete';
        setDebugTool(newTool);
        dispatchEditorUpdate({ toolbarState: { tool: newTool } });
    };

    return (
        <ToolbarButton
            label="Delete"
            isSelected={debugStore.tool === 'delete'}
            onClick={handleClick}
        >
            <Trash2 class="zylem-icon" />
        </ToolbarButton>
    );
};
