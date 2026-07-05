/**
 * Contracts between showcase demos and the UI shell.
 *
 * Each demo module (`demos/<name>/<name>.ts`) default-exports a factory
 * returning a {@link ShowcaseDemo}: a zylem `Game` plus a declarative list of
 * parameter controls the shell renders in the side panel.
 */
import type { Game } from '@zylem/game-lib/core';

/** Numeric slider bound to a shader uniform (or any setter). */
export interface RangeControl {
	type: 'range';
	label: string;
	min: number;
	max: number;
	step: number;
	value: number;
	onChange: (value: number) => void;
}

/** Color picker bound to a `Color` uniform (hex string in/out). */
export interface ColorControl {
	type: 'color';
	label: string;
	value: string;
	onChange: (hex: string) => void;
}

/**
 * A GLSL editor with an Apply button (used by the Shadertoy transpiler demo).
 * `apply` returns `null` on success or an error message to display.
 */
export interface GlslControl {
	type: 'glsl';
	label: string;
	initial: string;
	apply: (code: string) => string | null;
}

export type ShowcaseControl = RangeControl | ColorControl | GlslControl;

export interface ShowcaseDemo {
	game: Game<any>;
	controls: ShowcaseControl[];
	/** Short description rendered above the controls. */
	description?: string;
}

export type ShowcaseModule = {
	default: () => ShowcaseDemo;
};
