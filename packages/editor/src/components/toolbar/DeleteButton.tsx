import Trash2 from 'lucide-solid/icons/trash-2';
import type { Component } from 'solid-js';
import { setDebugTool, debugStore } from '..';
import { sendTool } from '../../bridge/editor-bridge';
import { ToolbarButton } from '@zylem/ui/components';

export const DeleteButton: Component = () => {
    const handleClick = () => {
        const newTool = debugStore.tool === 'delete' ? 'none' : 'delete';
        setDebugTool(newTool);
        sendTool(newTool);
    };

    return (
        <ToolbarButton
            label="Delete"
            selected={debugStore.tool === 'delete'}
            onClick={handleClick}
        >
            <Trash2 class="zylem-icon" />
        </ToolbarButton>
    );
};
