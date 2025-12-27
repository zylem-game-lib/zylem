import type { Component } from 'solid-js';
import { DeleteButton } from './DeleteButton';
import { AddButton } from './AddButton';
import { SelectButton } from './SelectButton';
import { PlayPauseButton } from './PlayPauseButton';

export const Toolbar: Component = () => {
    return (
        <div class="zylem-toolbar">
            <DeleteButton />
            <AddButton />
            <SelectButton />
            <PlayPauseButton />
        </div>
    );
};
