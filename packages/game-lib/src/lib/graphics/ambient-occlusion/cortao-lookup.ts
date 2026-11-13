/** Adapted from CORTAO v1.0.0, Copyright (c) 2026 Daniel Isheden, MIT.
 * See THIRD_PARTY_NOTICES.md. Float storage exactly represents these 16-bit masks,
 * avoiding integer texture sampling differences between WebGPU and WebGL2.
 */
export const CORTAO_RAYS = 16;
export const CORTAO_DIRECTION_SIZE = 24;
export const CORTAO_RADIUS_SIZE = 16;
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
let cached: Float32Array | undefined;
export function createCortaoLookupData(): Float32Array {
	if (cached) return cached;
	const size = CORTAO_DIRECTION_SIZE;
	const rays = Array.from({ length: CORTAO_RAYS }, (_, i) => {
		const radius = Math.sqrt((i + 0.5) / CORTAO_RAYS),
			angle = i * GOLDEN_ANGLE;
		return [Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sqrt(1 - radius * radius)];
	});
	const data = new Float32Array(size * size * CORTAO_RADIUS_SIZE);
	for (let z = 0; z < CORTAO_RADIUS_SIZE; z++) {
		const radius = (Math.SQRT2 * (z + 0.5)) / CORTAO_RADIUS_SIZE;
		const cosAngle = 1 - radius * radius * 0.5;
		const closest = rays.map(() => ({ index: 0, dot: -Infinity }));
		for (let y = 0; y < size; y++)
			for (let x = 0; x < size; x++) {
				const ex = (2 * (x + 0.5)) / size - 1,
					ey = (2 * (y + 0.5)) / size - 1;
				const sz = Math.max(1 - ex * ex - ey * ey, 0),
					mul = 2 * Math.sqrt(sz);
				const direction = [ex * mul, ey * mul, 2 * sz - 1];
				const index = (z * size + y) * size + x;
				if (direction[2] === -1) continue;
				let bits = 0;
				for (let i = 0; i < rays.length; i++) {
					const d = direction.reduce((sum, value, axis) => sum + value * rays[i][axis], 0);
					if (d > closest[i].dot) closest[i] = { index, dot: d };
					if (d > cosAngle) bits |= 1 << i;
				}
				data[index] = bits;
			}
		// Even the smallest represented circle must be able to hit every ray.
		for (let i = 0; i < rays.length; i++) data[closest[i].index] |= 1 << i;
	}
	cached = data;
	return data;
}
