/**
 * Contract between showcase exhibits and the UI shell.
 *
 * Each exhibit module (`demos/<id>/<id>.ts`) default-exports a factory
 * returning a {@link ShowcaseDemo}. The shell mounts `game` in `<zylem-game>`,
 * which starts it and disposes it when the exhibit is replaced, and lists
 * `description` and `controls` beside the viewport.
 */
import type { Game } from '@zylem/game-lib/core';

export interface ShowcaseDemo {
	game: Game<any>;
	/** What the exhibit shows, in a sentence or two. */
	description?: string;
	/**
	 * One line per control, written `<input>: <what it does>`, e.g.
	 * `Z: next stage`. The part before the first colon is drawn as a key cap.
	 */
	controls?: readonly string[];
}

export type ShowcaseModule = {
	default: () => ShowcaseDemo;
};
