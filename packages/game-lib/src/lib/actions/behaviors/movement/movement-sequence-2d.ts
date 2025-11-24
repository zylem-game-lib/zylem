import { UpdateContext } from "../../../core/base-node-life-cycle";
import { MoveableEntity } from "../../capabilities/moveable";
import { BehaviorCallbackType } from "../../../entities/entity";

export interface MovementSequence2DStep {
	name: string;
	moveX?: number;
	moveY?: number;
	timeInSeconds: number;
}

export interface MovementSequence2DOptions {
	sequence: MovementSequence2DStep[];
	loop?: boolean;
}

export type MovementSequence2DCallback = (
	current: MovementSequence2DStep,
	index: number,
	ctx: UpdateContext<MoveableEntity>
) => void;

type MovementSequence2DState = {
	currentIndex: number;
	timeRemaining: number;
	lastNotifiedIndex: number;
	done: boolean;
};

const STATE_KEY = "__movementSequence2D" as const;

/**
 * Behavior that sequences 2D movements over time.
 * Each step sets linear velocity via `moveXY` for a duration, then advances.
 * Defaults to looping when the end is reached.
 */
export function movementSequence2D(
	opts: MovementSequence2DOptions,
	onStep?: MovementSequence2DCallback
): { type: BehaviorCallbackType; handler: (ctx: UpdateContext<MoveableEntity>) => void } {
	const { sequence, loop = true } = opts;

	return {
		type: 'update' as BehaviorCallbackType,
		handler: (ctx: UpdateContext<MoveableEntity>) => {
			const { me, delta } = ctx;
			if (!sequence || sequence.length === 0) return;

			const custom: any = (me as any).custom ?? ((me as any).custom = {});
			let state: MovementSequence2DState = custom[STATE_KEY];
			if (!state) {
				state = {
					currentIndex: 0,
					timeRemaining: sequence[0].timeInSeconds,
					lastNotifiedIndex: -1,
					done: false
				};
				custom[STATE_KEY] = state;
			}

			if (state.done) return;

			let current = sequence[state.currentIndex];
			const moveX = current.moveX ?? 0;
			const moveY = current.moveY ?? 0;
			me.moveXY(moveX, moveY);

			if (state.lastNotifiedIndex !== state.currentIndex) {
				state.lastNotifiedIndex = state.currentIndex;
				onStep?.(current, state.currentIndex, ctx);
			}

			let timeLeft = state.timeRemaining - delta;
			while (timeLeft <= 0) {
				const overflow = -timeLeft;
				state.currentIndex += 1;
				if (state.currentIndex >= sequence.length) {
					if (!loop) {
						state.done = true;
						me.moveXY(0, 0);
						return;
					}
					state.currentIndex = 0;
				}
				current = sequence[state.currentIndex];
				timeLeft = current.timeInSeconds - overflow;
			}
			state.timeRemaining = timeLeft;
		}
	};
}


