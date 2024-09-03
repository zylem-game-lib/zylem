// TODO: this will only be necessary if we want to simplify game setup and make
// it so that the dev doesn't have to create an existing HTML element

export const GameCanvas = (targetRatio: number) => {
	const _targetRatio = targetRatio;
	let _canvasWrapper: Element | null = null;
	// this.ratio = options.ratio ?? '16:9';
		// this._targetRatio = Number(this.ratio.split(':')[0]) / Number(this.ratio.split(':')[1]);
	return {
		targetRatio: _targetRatio,
		canvasWrapper: _canvasWrapper
	}
}
