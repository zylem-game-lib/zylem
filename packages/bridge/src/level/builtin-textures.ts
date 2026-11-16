/**
 * The level textures that ship with the editor.
 *
 * They are generated, not loaded: a key and a size give the same pixels in
 * the editor's panel and in the game, with no file to serve. Every pattern
 * repeats cleanly at its edges. No DOM and no Three.js.
 */

export type BuiltinTextureKey = 'grid' | 'checker' | 'brick' | 'concrete';

export interface BuiltinTexture {
	key: BuiltinTextureKey;
	/** What a surface stores: `builtin:<key>`. */
	id: string;
	label: string;
}

export const BUILTIN_TEXTURE_PREFIX = 'builtin:';

/** Pixels along each side unless a caller asks for another size. */
export const BUILTIN_TEXTURE_SIZE = 128;

export const BUILTIN_TEXTURES: readonly BuiltinTexture[] = [
	{ key: 'grid', id: 'builtin:grid', label: 'Grid' },
	{ key: 'checker', id: 'builtin:checker', label: 'Checker' },
	{ key: 'brick', id: 'builtin:brick', label: 'Brick' },
	{ key: 'concrete', id: 'builtin:concrete', label: 'Concrete' },
];

/** The key of a built-in texture id, or `null` for any other id. */
export function builtinTextureKey(textureId: string): BuiltinTextureKey | null {
	if (!textureId.startsWith(BUILTIN_TEXTURE_PREFIX)) return null;
	const key = textureId.slice(BUILTIN_TEXTURE_PREFIX.length);
	return BUILTIN_TEXTURES.some((texture) => texture.key === key)
		? (key as BuiltinTextureKey)
		: null;
}

type Rgb = readonly [number, number, number];
/** A color for the point `(u, v)` of the tile, both `0..1`, `v` growing down the image. */
type Pattern = (u: number, v: number) => Rgb;

/** A repeatable pseudo-random number in `0..1` for a lattice cell. */
function hash(x: number, y: number, seed: number): number {
	let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed + 1, 1442695041);
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function shade(color: Rgb, amount: number): Rgb {
	return [color[0] + amount, color[1] + amount, color[2] + amount];
}

/** Distance to the nearest multiple of `step`. */
function toLine(value: number, step: number): number {
	const along = value / step;
	return Math.abs(along - Math.round(along)) * step;
}

/** Smooth noise that repeats every tile, `period` cells across. */
function tiledNoise(u: number, v: number, period: number, seed: number): number {
	const x = u * period;
	const y = v * period;
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const fx = x - x0;
	const fy = y - y0;
	const sx = fx * fx * (3 - 2 * fx);
	const sy = fy * fy * (3 - 2 * fy);
	const cell = (cx: number, cy: number) =>
		hash(((cx % period) + period) % period, ((cy % period) + period) % period, seed);
	const top = cell(x0, y0) + (cell(x0 + 1, y0) - cell(x0, y0)) * sx;
	const bottom = cell(x0, y0 + 1) + (cell(x0 + 1, y0 + 1) - cell(x0, y0 + 1)) * sx;
	return top + (bottom - top) * sy;
}

const GRID_BASE: Rgb = [118, 124, 133];
const GRID_MINOR: Rgb = [146, 152, 161];
const GRID_MAJOR: Rgb = [214, 218, 225];

/** One square per tile, a bright line on its edge and a faint cross through its middle. */
const grid: Pattern = (u, v) => {
	if (toLine(u, 1) < 1 / 48 || toLine(v, 1) < 1 / 48) return GRID_MAJOR;
	if (toLine(u, 0.5) < 1 / 96 || toLine(v, 0.5) < 1 / 96) return GRID_MINOR;
	return GRID_BASE;
};

const CHECKER_LIGHT: Rgb = [178, 180, 185];
const CHECKER_DARK: Rgb = [108, 111, 118];

/** Two squares each way per tile. */
const checker: Pattern = (u, v) =>
	(Math.floor(u * 2) + Math.floor(v * 2)) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK;

const BRICK_ROWS = 4;
const BRICKS_PER_ROW = 2;
const MORTAR = 0.035;
const BRICK_COLOR: Rgb = [152, 76, 60];
const MORTAR_COLOR: Rgb = [198, 191, 178];

/** Running bond: four courses per tile, each shifted half a brick from the last. */
const brick: Pattern = (u, v) => {
	const row = Math.min(BRICK_ROWS - 1, Math.floor(v * BRICK_ROWS));
	const across = u * BRICKS_PER_ROW + (row % 2 === 0 ? 0 : 0.5);
	const column = Math.floor(across) % BRICKS_PER_ROW;
	const inRow = v * BRICK_ROWS - row;
	const inBrick = across - Math.floor(across);
	const edgeV = Math.min(inRow, 1 - inRow) / BRICK_ROWS;
	const edgeU = Math.min(inBrick, 1 - inBrick) / BRICKS_PER_ROW;
	const grain = (tiledNoise(u, v, 32, 7) - 0.5) * 14;
	if (edgeV < MORTAR / 2 || edgeU < MORTAR / 2) return shade(MORTAR_COLOR, grain * 0.5);
	return shade(BRICK_COLOR, (hash(column, row, 3) - 0.5) * 34 + grain);
};

const CONCRETE_COLOR: Rgb = [146, 146, 142];

/** Soft mottling at three sizes. */
const concrete: Pattern = (u, v) => {
	const mottle =
		(tiledNoise(u, v, 4, 11) - 0.5) * 30 +
		(tiledNoise(u, v, 16, 12) - 0.5) * 18 +
		(tiledNoise(u, v, 64, 13) - 0.5) * 14;
	return shade(CONCRETE_COLOR, mottle);
};

const PATTERNS: Record<BuiltinTextureKey, Pattern> = { grid, checker, brick, concrete };

/**
 * One tile of a built-in texture as RGBA bytes, `size` × `size`, rows from
 * the top of the image down. Opaque.
 */
export function builtinTexturePixels(
	key: BuiltinTextureKey,
	size: number = BUILTIN_TEXTURE_SIZE
): Uint8ClampedArray {
	const side = Math.max(1, Math.floor(size));
	const pattern = PATTERNS[key];
	const pixels = new Uint8ClampedArray(side * side * 4);
	for (let y = 0; y < side; y += 1) {
		for (let x = 0; x < side; x += 1) {
			const [r, g, b] = pattern((x + 0.5) / side, (y + 0.5) / side);
			const at = (y * side + x) * 4;
			pixels[at] = r;
			pixels[at + 1] = g;
			pixels[at + 2] = b;
			pixels[at + 3] = 255;
		}
	}
	return pixels;
}
