import Redo2 from 'lucide-solid/icons/redo-2';
import Undo2 from 'lucide-solid/icons/undo-2';
import type { Component } from 'solid-js';

import { historyStore, redo, undo } from '../history/history-store';
import { ToolbarButton } from '@zylem/ui/components';

const lastLabel = (stack: { label: string }[]): string | null =>
	stack[stack.length - 1]?.label ?? null;

export const UndoButton: Component = () => {
	const label = () => {
		const next = lastLabel(historyStore.undoStack);
		return next ? `Undo ${next}` : 'Nothing to undo';
	};

	return (
		<ToolbarButton label={label()} onClick={() => undo()}>
			<Undo2 class="zylem-icon" />
		</ToolbarButton>
	);
};

export const RedoButton: Component = () => {
	const label = () => {
		const next = lastLabel(historyStore.redoStack);
		return next ? `Redo ${next}` : 'Nothing to redo';
	};

	return (
		<ToolbarButton label={label()} onClick={() => redo()}>
			<Redo2 class="zylem-icon" />
		</ToolbarButton>
	);
};
