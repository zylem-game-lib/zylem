import {
	Color,
	DataTexture,
	LinearFilter,
	LinearMipmapLinearFilter,
	RepeatWrapping,
	RGBAFormat,
	SRGBColorSpace,
	UnsignedByteType,
} from 'three';

function hash(x: number, y: number, z: number, seed: number) {
	let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed;
	n = Math.imul(n ^ (n >>> 13), 1274126177);
	return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number, z: number, seed: number): number {
	const ix = Math.floor(x),
		iy = Math.floor(y),
		iz = Math.floor(z);
	const sx = x - ix,
		sy = y - iy,
		sz = z - iz;
	const fx = sx * sx * (3 - 2 * sx),
		fy = sy * sy * (3 - 2 * sy),
		fz = sz * sz * (3 - 2 * sz);
	let n = 0;
	for (let k = 0; k < 2; k++)
		for (let j = 0; j < 2; j++)
			for (let i = 0; i < 2; i++)
				n +=
					hash(ix + i, iy + j, iz + k, seed) *
					(i ? fx : 1 - fx) *
					(j ? fy : 1 - fy) *
					(k ? fz : 1 - fz);
	return n;
}
function fbm(x: number, y: number, z: number, seed: number, octaves = 5) {
	let sum = 0,
		weight = 0.5,
		total = 0;
	for (let i = 0; i < octaves; i++) {
		sum += noise(x, y, z, seed + i * 31) * weight;
		total += weight;
		x *= 2.03;
		y *= 2.03;
		z *= 2.03;
		weight *= 0.5;
	}
	return sum / total;
}
const smooth = (a: number, b: number, x: number) => {
	const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};
function dataTexture(data: Uint8Array, width: number, height: number, color = true) {
	const map = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
	map.colorSpace = color ? SRGBColorSpace : '';
	map.wrapS = RepeatWrapping;
	map.magFilter = LinearFilter;
	map.minFilter = LinearMipmapLinearFilter;
	map.generateMipmaps = true;
	map.needsUpdate = true;
	return map;
}
/** Spherical 3D noise keeps the longitude seam and both poles continuous. */
export function createPlanetTextures(
	seed: number,
	ocean: string | number,
	land: string | number,
	oceanCoverage: number
) {
	const width = 1024,
		height = 512;
	const surface = new Uint8Array(width * height * 4),
		roughness = new Uint8Array(surface.length),
		clouds = new Uint8Array(surface.length);
	const sea = new Color(ocean),
		earth = new Color(land),
		c = new Color(),
		dry = new Color();
	// Keep detail in the chosen palette instead of introducing cyan/purple bands.
	const shallow = sea.clone().multiplyScalar(1.12),
		highland = earth.clone().multiplyScalar(0.94);
	for (let v = 0; v < height; v++)
		for (let u = 0; u < width; u++) {
			const theta = (2 * Math.PI * (u + 0.5)) / width,
				phi = (Math.PI * (v + 0.5)) / height;
			const x = -Math.cos(theta) * Math.sin(phi),
				y = -Math.cos(phi),
				z = Math.sin(theta) * Math.sin(phi);
			const warp = noise(x * 3 + 7, y * 3, z * 3, seed);
			const terrain = fbm(x * 3.2 + warp, y * 3.2 + warp, z * 3.2, seed);
			// Coverage is an artistic threshold control, not an exact area percentage.
			const level = 0.38 + oceanCoverage * 0.27;
			const landMask = smooth(level - 0.006, level + 0.006, terrain);
			c.copy(sea)
				.multiplyScalar(0.65 + terrain * 0.6)
				.lerp(shallow, smooth(level - 0.04, level, terrain) * 0.25);
			dry.copy(earth).lerp(highland, smooth(level, level + 0.2, terrain));
			c.lerp(dry, landMask).convertLinearToSRGB();
			const i = (v * width + u) * 4;
			surface[i] = Math.round(c.r * 255);
			surface[i + 1] = Math.round(c.g * 255);
			surface[i + 2] = Math.round(c.b * 255);
			surface[i + 3] = 255;
			const r = Math.round((0.38 + landMask * 0.24) * 255);
			roughness.set([r, r, r, 255], i);
			const w = noise(x * 5, y * 5 + 17, z * 5, seed + 19) * 1.3;
			const cloud = fbm(x * 5 + w, y * 6 + w, z * 5, seed + 97, 5);
			const alpha = Math.round(smooth(0.56, 0.7, cloud) * 72);
			clouds.set([104, 170, 242, alpha], i);
		}
	return {
		surface: dataTexture(surface, width, height),
		roughness: dataTexture(roughness, width, height, false),
		clouds: dataTexture(clouds, width, height),
	};
}
export function createMoonTexture(seed: number) {
	const width = 256,
		height = 128,
		data = new Uint8Array(width * height * 4);
	const craters = Array.from({ length: 55 }, (_, i) => {
		const y = hash(i, 0, 0, seed) * 2 - 1,
			a = hash(i, 1, 0, seed) * 2 * Math.PI,
			r = Math.sqrt(1 - y * y);
		return {
			x: r * Math.cos(a),
			y,
			z: r * Math.sin(a),
			radius: 0.025 + hash(i, 2, 0, seed) * 0.14,
		};
	});
	for (let v = 0; v < height; v++)
		for (let u = 0; u < width; u++) {
			const a = (2 * Math.PI * (u + 0.5)) / width,
				b = (Math.PI * (v + 0.5)) / height;
			const x = -Math.cos(a) * Math.sin(b),
				y = -Math.cos(b),
				z = Math.sin(a) * Math.sin(b);
			let value = 0.48 + fbm(x * 7, y * 7, z * 7, seed) * 0.4;
			for (const crater of craters) {
				const distance =
					Math.sqrt(Math.max(0, 2 - 2 * (x * crater.x + y * crater.y + z * crater.z))) /
					crater.radius;
				value -= (1 - smooth(0.65, 0.98, distance)) * 0.23;
				value += Math.exp(-Math.pow((distance - 1) * 12, 2)) * 0.16;
			}
			const i = (v * width + u) * 4,
				c = Math.round(Math.min(1, value) * 255);
			data.set([Math.round(c * 0.9), Math.round(c * 0.93), c, 255], i);
		}
	return dataTexture(data, width, height);
}
