// TODO: this will only be necessary if we want to simplify game setup and make
// it so that the dev doesn't have to create an existing HTML element

export const GameCanvas = (targetRatio: number) => {
	const _targetRatio = targetRatio;
	let _canvasWrapper: Element | null = null;
	return {
		targetRatio: _targetRatio,
		canvasWrapper: _canvasWrapper
	}
}
