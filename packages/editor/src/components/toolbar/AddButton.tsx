import Plus from 'lucide-solid/icons/plus';
import type { Component } from 'solid-js';
import { setDebugTool, debugStore } from '..';
import { dispatchEditorUpdate } from '../editor-events';
import { ToolbarButton } from './ToolbarButton';

export const AddButton: Component = () => {
    const handleClick = () => {
        const newTool = debugStore.tool === 'translate' ? 'none' : 'translate';
        setDebugTool(newTool);
        dispatchEditorUpdate({ toolbarState: { tool: newTool } });
    };

    return (
        <ToolbarButton
            label="Add"
            isSelected={debugStore.tool === 'translate'}
            onClick={handleClick}
        >
            <Plus class="zylem-icon" />
        </ToolbarButton>
    );
};
