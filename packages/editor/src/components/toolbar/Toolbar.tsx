import { type Component } from 'solid-js';
import { DeleteButton } from './DeleteButton';
import { AddButton } from './AddButton';
import { SelectButton } from './SelectButton';
import { PlayPauseButton } from './PlayPauseButton';
import { DebugButton } from './DebugButton';
import { GridButton, SnapButton } from './GridButton';
import { RedoButton, UndoButton } from './HistoryButtons';
import { RotateButton, ScaleButton, TranslateButton } from './TransformButtons';

export const Toolbar: Component = () => {
    return (
        <div class="zylem-toolbar">
            <div class="zylem-toolbar-group">
                <DebugButton />
                <SelectButton />
                {/*
                 * Always mounted, disabling themselves when there is nothing to
                 * act on. They used to appear with the selection, which moved
                 * every button to their right each time it changed.
                 */}
                <span class="zylem-toolbar-transforms">
                    <TranslateButton />
                    <RotateButton />
                    <ScaleButton />
                </span>
            </div>
            <span class="zylem-toolbar-divider" />
            <div class="zylem-toolbar-group">
                <AddButton />
                <DeleteButton />
            </div>
            <span class="zylem-toolbar-divider" />
            <div class="zylem-toolbar-group">
                <SnapButton />
                <GridButton />
                <UndoButton />
                <RedoButton />
                <PlayPauseButton />
            </div>
        </div>
    );
};
