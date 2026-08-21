import Bug from 'lucide-solid/icons/bug';
import type { Component } from 'solid-js';
import { debugStore, setDebugStore } from '../editor-store';
import { sendDebugEnabled } from '../../bridge/editor-bridge';
import { ToolbarButton } from '@zylem/ui/components';

export const DebugButton: Component = () => {
    const handleClick = () => {
        const newDebug = !debugStore.debug;
        setDebugStore('debug', newDebug);
        sendDebugEnabled(newDebug);
    };

    return (
        <ToolbarButton
            label="Debug"
            selected={debugStore.debug}
            onClick={handleClick}
        >
            <Bug class="zylem-icon" />
        </ToolbarButton>
    );
};
