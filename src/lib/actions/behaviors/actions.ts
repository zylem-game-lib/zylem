// TODO: rewrite these functions to work well within game loop

export function wait(delay: number, callback: Function) {
	// TODO: needs ticks from loop
	setTimeout(callback, delay);
}

export const actionOnPress = (() => {
	let buttonPressed = false;

	return (isPressed: boolean, callback: Function) => {
		if (isPressed && !buttonPressed) {
			buttonPressed = true;
			callback();
		} else if (!isPressed) {
			buttonPressed = false;
		}
	};
})();

export const actionOnRelease = (() => {
	let buttonPressed = false;

	return (isPressed: boolean, callback: Function) => {
		if (!isPressed && buttonPressed) {
			buttonPressed = false;
			callback();
		} else if (isPressed) {
			buttonPressed = true;
		}
	};
})();

type CooldownOptions = { timer: number; immediate?: boolean };

export const actionWithCooldown = (() => {
	let lastExecutionTime = -Infinity;
	let flagImmediate = false;

	return ({ timer, immediate = true }: CooldownOptions, callback: Function, update: Function) => {
		let currentTime = Date.now();

		if (!flagImmediate && !immediate) {
			flagImmediate = true;
			lastExecutionTime = currentTime;
		}

		const delta = currentTime - lastExecutionTime;

		if (delta >= timer) {
			lastExecutionTime = currentTime;
			callback();
		}
		update({ delta });
	};
})();

export const actionWithThrottle = (() => {
	let lastExecutionTime = 0;

	return (timer: number, callback: Function) => {
		const currentTime = Date.now();
		const delta = currentTime - lastExecutionTime;

		if (delta >= timer) {
			lastExecutionTime = currentTime;
			callback();
		}
	};
})();
