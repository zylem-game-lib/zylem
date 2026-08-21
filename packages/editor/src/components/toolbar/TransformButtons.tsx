import Move3d from 'lucide-solid/icons/move-3d';
import Rotate3d from 'lucide-solid/icons/rotate-3d';
import Scale3d from 'lucide-solid/icons/scale-3d';
import { createMemo, type Component, type JSX } from 'solid-js';
import { setDebugTool, debugStore, setSelectedEntityId, type DebugTools } from '..';
import { sendAddType, sendEntitySelect, sendTool } from '../../bridge/editor-bridge';
import { useEditor } from '../EditorContext';
import { setArmedType } from './catalog-state';
import { resolveTransformTarget } from './transform-button-state';
import { ToolbarButton } from '@zylem/ui/components';

interface TransformToolButtonProps {
	tool: Extract<DebugTools, 'translate' | 'rotate' | 'scale'>;
	label: string;
	children: JSX.Element;
}

/**
 * A gizmo-mode toggle. Selecting one disarms the Add tool, since a click would
 * otherwise be ambiguous between placing and grabbing a handle.
 *
 * Always mounted, rather than appearing with the selection: a toolbar whose
 * buttons come and go is one you have to look at before you can aim at it, and
 * pressing one with nothing selected has an obvious meaning — act on whatever was
 * last worked on. Disabled only when even that is unavailable.
 */
const TransformToolButton: Component<TransformToolButtonProps> = (props) => {
	const { stage } = useEditor();

	const target = createMemo(() =>
		resolveTransformTarget(
			debugStore.selected,
			debugStore.lastTouched,
			stage.entities
				.map((entity) => entity.uuid)
				.filter((uuid): uuid is string => Boolean(uuid)),
		),
	);

	const handleClick = () => {
		const uuid = target();
		if (!uuid) return;

		const nextTool = debugStore.tool === props.tool ? 'none' : props.tool;
		setArmedType(null);
		sendAddType(null);

		/*
		 * Selection first, and both writes in one synchronous run. The transform
		 * guard drops a gizmo tool whose selection is empty, and it only ever sees
		 * the state a batch of `debugState` writes leaves behind — so what keeps
		 * this safe is that nothing awaits in between, rather than the order alone.
		 * Sent to the game as well as set here, because the gizmo's pivot is
		 * computed game-side from its own copy of the selection.
		 */
		if (nextTool !== 'none' && debugStore.selected.length === 0) {
			setSelectedEntityId(uuid);
			sendEntitySelect(uuid);
		}

		setDebugTool(nextTool);
		sendTool(nextTool);
	};

	return (
		<ToolbarButton
			label={props.label}
			selected={debugStore.tool === props.tool}
			disabled={!target()}
			onClick={handleClick}
		>
			{props.children}
		</ToolbarButton>
	);
};

export const TranslateButton: Component = () => (
	<TransformToolButton tool="translate" label="Move">
		<Move3d class="zylem-icon" />
	</TransformToolButton>
);

export const RotateButton: Component = () => (
	<TransformToolButton tool="rotate" label="Rotate">
		<Rotate3d class="zylem-icon" />
	</TransformToolButton>
);

export const ScaleButton: Component = () => (
	<TransformToolButton tool="scale" label="Scale">
		<Scale3d class="zylem-icon" />
	</TransformToolButton>
);
