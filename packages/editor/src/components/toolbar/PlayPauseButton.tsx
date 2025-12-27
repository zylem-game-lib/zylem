import Pause from 'lucide-solid/icons/pause';
import Play from 'lucide-solid/icons/play';
import type { Component } from 'solid-js';
import { setPaused, debugState, debugStore } from '..';
import { dispatchEditorUpdate } from '../editor-events';
import { ToolbarButton } from './ToolbarButton';

export const PlayPauseButton: Component = () => {
    const handleClick = () => {
        const newPaused = !debugState.paused;
        setPaused(newPaused);
        dispatchEditorUpdate({ toolbarState: { paused: newPaused } });
    };

    return (
        <ToolbarButton
            label={debugStore.paused ? 'Play' : 'Pause'}
            isSelected={debugStore.paused}
            onClick={handleClick}
        >
            {debugStore.paused ? (
                <Play class="zylem-icon" />
            ) : (
                <Pause class="zylem-icon" />
            )}
        </ToolbarButton>
    );
};
