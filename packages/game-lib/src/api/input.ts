// Input presets
export {
	useArrowsForAxes,
	useArrowsForSecondaryAxes,
	useArrowsForDirections,
	useWASDForDirections,
	useWASDForAxes,
	useIJKLForAxes,
	useIJKLForDirections,
	useMouseLook,
	useMouse,
	useVirtualControls,
	mergeInputConfigs,
} from '../lib/input/input-presets';

// Input shape types — used by gameplay-side controllers to strong-type
// the `inputs` payload handed to `entity.onUpdate(({ inputs }) => ...)`.
export type {
	Inputs,
	InputPlayer,
	InputGamepad,
	ButtonState,
	AnalogState,
	ButtonName,
	InputPlayerNumber,
	InputProvider,
} from '../lib/input/input';
