import { describe, expect, it } from 'vitest';

import {
	KHR_GAUSSIAN_SPLATTING,
	KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION,
	classifyPly,
	gltfUsesGaussianSplatting,
	inspectGltfExtensions,
	plyHeaderHasGaussianProperties,
	readPlyHeader,
	requiredSpzGaussianCompression,
} from '../../../src/lib/core/loaders/model-sniff';

const MESH_PLY = `ply
format ascii 1.0
element vertex 3
property float x
property float y
property float z
element face 1
property list uchar int vertex_indices
end_header
0 0 0
1 0 0
0 1 0
3 0 1 2
`;

const SPLAT_PLY = `ply
format ascii 1.0
element vertex 1
property float x
property float y
property float z
property float scale_0
property float rot_0
property float f_dc_0
property float opacity
end_header
0 0 0 1 0 0 1
`;

function textBuffer(text: string): ArrayBuffer {
	const bytes = new TextEncoder().encode(text);
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function encodeGlb(json: object): ArrayBuffer {
	const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
	const padding = (4 - (jsonBytes.byteLength % 4)) % 4;
	const chunkLength = jsonBytes.byteLength + padding;
	const total = 12 + 8 + chunkLength;
	const buffer = new ArrayBuffer(total);
	const view = new DataView(buffer);
	view.setUint32(0, 0x46546c67, true);
	view.setUint32(4, 2, true);
	view.setUint32(8, total, true);
	view.setUint32(12, chunkLength, true);
	view.setUint32(16, 0x4e4f534a, true);
	const chunk = new Uint8Array(buffer, 20, chunkLength);
	chunk.set(jsonBytes);
	chunk.fill(0x20, jsonBytes.byteLength);
	return buffer;
}

describe('model container sniffing', () => {
	it('routes a Stanford PLY to the mesh parser and a Gaussian PLY to the splat parser', () => {
		const mesh = textBuffer(MESH_PLY);
		const splat = textBuffer(SPLAT_PLY);

		expect(plyHeaderHasGaussianProperties(readPlyHeader(mesh) ?? '')).toBe(false);
		expect(plyHeaderHasGaussianProperties(readPlyHeader(splat) ?? '')).toBe(true);
		expect(classifyPly(mesh)).toBe('mesh');
		expect(classifyPly(splat)).toBe('splat');
		expect(classifyPly(splat, 'mesh')).toBe('mesh');
		expect(classifyPly(mesh, 'splat')).toBe('splat');
	});

	it('reads gaussian and unsupported SPZ extensions from a GLB JSON chunk', () => {
		const plain = inspectGltfExtensions(encodeGlb({ asset: { version: '2.0' } }));
		const gaussian = inspectGltfExtensions(encodeGlb({
			asset: { version: '2.0' },
			extensionsUsed: [KHR_GAUSSIAN_SPLATTING],
		}));
		const compressed = inspectGltfExtensions(encodeGlb({
			asset: { version: '2.0' },
			extensionsRequired: [KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION],
		}));

		expect(gltfUsesGaussianSplatting(plain)).toBe(false);
		expect(gltfUsesGaussianSplatting(gaussian)).toBe(true);
		expect(requiredSpzGaussianCompression(compressed)).toBe(true);
	});

	it('reads the same extension lists from a glTF JSON body', () => {
		const json = textBuffer(JSON.stringify({
			asset: { version: '2.0' },
			extensionsUsed: [KHR_GAUSSIAN_SPLATTING],
		}));

		expect(gltfUsesGaussianSplatting(inspectGltfExtensions(json))).toBe(true);
	});
});
