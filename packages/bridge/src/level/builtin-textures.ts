/**
 * The level textures that ship with the editor.
 *
 * They are generated, not loaded: a key and a size give the same pixels in
 * the editor's panel and in the game, with no file to serve. Every pattern
 * repeats cleanly at its edges. No DOM and no Three.js.
 */

export type BuiltinTextureKey = keyof typeof TEXTURES;

export interface BuiltinTexture {
	key: BuiltinTextureKey;
	/** What a surface stores: `builtin:<key>`. */
	id: string;
	label: string;
}

export const BUILTIN_TEXTURE_PREFIX = 'builtin:';

/** Pixels along each side unless a caller asks for another size. */
export const BUILTIN_TEXTURE_SIZE = 128;

/** The key of a built-in texture id, or `null` for any other id. */
export function builtinTextureKey(textureId: string): BuiltinTextureKey | null {
	if (!textureId.startsWith(BUILTIN_TEXTURE_PREFIX)) return null;
	const key = textureId.slice(BUILTIN_TEXTURE_PREFIX.length);
	return BUILTIN_TEXTURES.find((texture) => texture.key === key)?.key ?? null;
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

function wrapCell(cell: number, period: number): number {
	return ((cell % period) + period) % period;
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
	const left = wrapCell(x0, period);
	const right = wrapCell(x0 + 1, period);
	const upper = wrapCell(y0, period);
	const lower = wrapCell(y0 + 1, period);
	const topLeft = hash(left, upper, seed);
	const bottomLeft = hash(left, lower, seed);
	const top = topLeft + (hash(right, upper, seed) - topLeft) * sx;
	const bottom = bottomLeft + (hash(right, lower, seed) - bottomLeft) * sx;
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

const grass: Pattern = (u, v) => {
	const patch = tiledNoise(u, v, 5, 20);
	const thatch = tiledNoise(3 * u + v + patch * 0.16, v, 24, 21);
	const along = (v - Math.floor(v)) * 18;
	const row = Math.floor(along);
	const across = u * 32 + hash(0, row, 22);
	const column = Math.floor(across);
	const lean = hash(wrapCell(column, 32), row, 23) - 0.5;
	const height = (0.92 - (along - row)) / (0.55 + Math.abs(lean) * 0.6);
	let blade = 0;
	if (height > 0 && height < 1) {
		const center = 0.5 + lean * (height * height - 0.3);
		const width = 0.13 * (1 - height) + 0.025;
		blade = Math.max(0, 1 - Math.abs(across - column - center) / width);
	}
	const light = (thatch - 0.5) * 43 + blade * 40;
	return [46 + patch * 32 + light, 76 + patch * 28 + light, 35 + patch * 6 + light * 0.45];
};

const dirt: Pattern = (u, v) => {
	const earth = (tiledNoise(u, v, 5, 30) - 0.5) * 38;
	const grit = (tiledNoise(u, v, 80, 31) - 0.5) * 28;
	const clods = tiledNoise(u + earth * 0.001, v, 30, 32);
	const pebbles = Math.max(0, clods - 0.69) * 130;
	return shade([114, 79, 52], earth + grit + (clods - 0.5) * 27 + pebbles);
};

/** Fracture lines follow the boundaries between neighboring rock faces. */
const STONE_PERIOD = 4;
const STONE_CELLS = Array.from({ length: STONE_PERIOD ** 2 }, (_, i) => ({
	x: 0.16 + 0.68 * hash(i, 0, 40),
	y: 0.16 + 0.68 * hash(i, 0, 41),
	tone: (hash(i, 0, 42) - 0.5) * 30,
}));

const stone: Pattern = (u, v) => {
	const x = u * STONE_PERIOD + (tiledNoise(u, v, 12, 43) - 0.5) * 0.23;
	const y = v * STONE_PERIOD + (tiledNoise(u, v, 12, 44) - 0.5) * 0.23;
	const column = Math.floor(x);
	const row = Math.floor(y);
	let nearest = Infinity;
	let second = Infinity;
	let tone = 0;
	for (let cy = row - 1; cy <= row + 1; cy++) {
		const rowOffset = wrapCell(cy, STONE_PERIOD) * STONE_PERIOD;
		for (let cx = column - 1; cx <= column + 1; cx++) {
			const cell = STONE_CELLS[rowOffset + wrapCell(cx, STONE_PERIOD)];
			const dx = x - cx - cell.x;
			const dy = y - cy - cell.y;
			const distance = dx * dx + dy * dy;
			if (distance < nearest) {
				second = nearest;
				nearest = distance;
				tone = cell.tone;
			} else {
				second = Math.min(second, distance);
			}
		}
	}
	const gap = Math.sqrt(second) - Math.sqrt(nearest);
	const crack = Math.max(0, 1 - gap / 0.08);
	const mineral = (tiledNoise(u + v, v, 16, 45) - 0.5) * 27;
	const grain = (tiledNoise(u, v, 72, 46) - 0.5) * 19;
	return shade([121, 127, 132], tone + mineral + grain - 51 * crack);
};

/** Crater centers and radii in tile coordinates. Some rims cross the tile boundary. */
const CRATERS = [
	[0.05, 0.28, 0.115],
	[0.35, 0.1, 0.045],
	[0.72, 0.18, 0.077],
	[0.41, 0.56, 0.105],
	[0.78, 0.73, 0.143],
	[0.18, 0.8, 0.052],
	[0.56, 0.94, 0.035],
] as const;

function martianGround(color: Rgb): Pattern {
	return (u, v) => {
		const wind = tiledNoise(u + v, v, 8, 50);
		const rubble = tiledNoise(u, v, 29, 51);
		const dust = tiledNoise(u, v, 83, 52);
		let relief = (wind - 0.5) * 36 + (rubble - 0.5) * 28 + (dust - 0.5) * 24;
		for (const [cx, cy, radius] of CRATERS) {
			const dx = (u - cx - Math.round(u - cx)) / radius;
			const dy = (v - cy - Math.round(v - cy)) / radius;
			if (Math.abs(dx) > 1.35 || Math.abs(dy) > 1.35) continue;
			const distance = Math.sqrt(dx * dx + dy * dy) + (rubble - 0.5) * 0.22;
			const rim = Math.max(0, 1 - Math.abs(distance - 1) / 0.22);
			const floor = Math.max(0, 1 - distance);
			relief += rim * (23 - 17 * (dx + dy)) + floor * (-42 + 38 * (dx + dy));
		}
		return shade(color, relief);
	};
}

const futuristicTile: Pattern = (u, v) => {
	const x = Math.abs(u - 0.5);
	const y = Math.abs(v - 0.5);
	const edge = Math.min(0.5 - x, 0.5 - y, (0.915 - x - y) / Math.SQRT2);
	const grain = (tiledNoise(u, v, 64, 60) - 0.5) * 7;
	if (edge < 0.014) return shade([27, 38, 47], grain);
	if (edge < 0.036) return shade([71, 87, 100], (u + v < 1 ? 19 : -14) + grain);
	if (edge < 0.048) return [45, 58, 69];
	if (y > 0.414 && y < 0.432 && x < 0.17 && x > 0.012) return [105, 211, 224];
	if (Math.hypot(x - 0.37, y - 0.37) < 0.017) return [43, 55, 64];
	if (u > 0.65 && u < 0.83 && v > 0.67 && v < 0.76 && toLine(u + v * 0.4, 0.033) < 0.006) {
		return [49, 63, 76];
	}
	return shade([88, 105, 119], grain + (0.5 - v) * 11);
};

const asphalt: Pattern = (u, v) => {
	const wear = (tiledNoise(u, v, 5, 70) - 0.5) * 16;
	const grit = tiledNoise(u, v, 95, 71);
	const aggregate = tiledNoise(u, v, 52, 72);
	const chips = aggregate > 0.72 ? 24 + (aggregate - 0.72) * 93 : 0;
	return shade([56, 58, 61], wear + (grit - 0.5) * 54 + chips);
};

const TEXTURES = {
	grid: { label: 'Grid', pattern: grid },
	checker: { label: 'Checker', pattern: checker },
	brick: { label: 'Brick', pattern: brick },
	concrete: { label: 'Concrete', pattern: concrete },
	grass: { label: 'Grass', pattern: grass },
	dirt: { label: 'Dirt', pattern: dirt },
	stone: { label: 'Stone', pattern: stone },
	'martian-ground-red': { label: 'Martian Ground (Red)', pattern: martianGround([165, 70, 52]) },
	'martian-ground-orange': {
		label: 'Martian Ground (Orange)',
		pattern: martianGround([193, 115, 57]),
	},
	'martian-ground-green': {
		label: 'Martian Ground (Green)',
		pattern: martianGround([100, 135, 78]),
	},
	'martian-ground-blue': { label: 'Martian Ground (Blue)', pattern: martianGround([72, 105, 151]) },
	'futuristic-tile': { label: 'Futuristic Tile', pattern: futuristicTile },
	asphalt: { label: 'Asphalt', pattern: asphalt },
} satisfies Record<string, { label: string; pattern: Pattern }>;

export const BUILTIN_TEXTURES: readonly BuiltinTexture[] = (
	Object.keys(TEXTURES) as BuiltinTextureKey[]
).map((key) => ({ key, id: BUILTIN_TEXTURE_PREFIX + key, label: TEXTURES[key].label }));

/**
 * One tile of a built-in texture as RGBA bytes, `size` × `size`, rows from
 * the top of the image down. Opaque.
 */
export function builtinTexturePixels(
	key: BuiltinTextureKey,
	size: number = BUILTIN_TEXTURE_SIZE
): Uint8ClampedArray {
	const side = Math.max(1, Math.floor(size));
	const pattern = TEXTURES[key].pattern;
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
