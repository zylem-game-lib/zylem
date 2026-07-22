/**
 * `@zylem/game-lib/input` public API.
 * @public
 */
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
	useScreenCenterLook,
	useMouse,
	useVirtualControls,
	mergeInputConfigs,
} from '../lib/input/input-presets';

export {
	screenCenterLookTargets,
	screenCenterLookDeltas,
	shortestAngleDelta,
} from '../lib/input/screen-center-look';
export type { ScreenCenterLookTargets, ScreenCenterLookOptions } from '../lib/input/screen-center-look';

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
