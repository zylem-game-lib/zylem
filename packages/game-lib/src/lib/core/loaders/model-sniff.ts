/**
 * Header sniffing for formats that share an extension.
 *
 * `.ply` is either a Stanford mesh or a 3D Gaussian splat.
 * `.glb` / `.gltf` may carry `KHR_gaussian_splatting` or the unsupported
 * `KHR_spz_gaussian_splats_compression` draft.
 */

export const KHR_GAUSSIAN_SPLATTING = 'KHR_gaussian_splatting';
export const KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION = 'KHR_spz_gaussian_splats_compression';

/** KSPLATLoader refuses files above this count. PLY and SPZ do not, so the adapter applies the same cap. */
export const MAX_GAUSSIAN_SPLATS = 10_000_000;

export const ALEMBIC_UNSUPPORTED_MESSAGE =
	'Alembic (.abc) is not a runtime format. Export glTF for skinned or morphed meshes, or MDD for a constant-topology point cache.';

export const STREAMED_SOG_UNSUPPORTED_MESSAGE =
	'Streamed SOG (lod-meta.json) is not supported. Export a bundled .sog file.';

export const SOG_NOT_INSTALLED_MESSAGE =
	'SOG support is not installed. Install the optional dependency @playcanvas/splat-transform.';

const PLY_HEADER_SCAN_BYTES = 1024 * 1024;
const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;
const GAUSSIAN_PLY_PROPERTIES = ['scale_0', 'rot_0', 'f_dc_0', 'opacity'] as const;

export interface GltfExtensionLists {
	extensionsUsed: string[];
	extensionsRequired: string[];
}

export function readPlyHeader(buffer: ArrayBuffer): string | null {
	const length = Math.min(buffer.byteLength, PLY_HEADER_SCAN_BYTES);
	const text = new TextDecoder('utf-8').decode(new Uint8Array(buffer, 0, length));
	if (!text.startsWith('ply')) {
		return null;
	}
	const end = text.indexOf('end_header');
	if (end < 0) {
		return null;
	}
	return text.slice(0, end);
}

export function plyHeaderHasGaussianProperties(header: string): boolean {
	const names = new Set<string>();
	for (const line of header.split(/\r\n|\r|\n/)) {
		const match = /^property\s+\S+\s+(\S+)\s*$/.exec(line.trim());
		if (match) {
			names.add(match[1]);
		}
	}
	return GAUSSIAN_PLY_PROPERTIES.every((name) => names.has(name));
}

export type PlyKind = 'mesh' | 'splat';

export function classifyPly(buffer: ArrayBuffer, fileType?: string | null): PlyKind {
	if (fileType === 'mesh' || fileType === 'splat') {
		return fileType;
	}
	const header = readPlyHeader(buffer);
	if (!header) {
		throw new Error('PLY file is missing an ASCII header.');
	}
	return plyHeaderHasGaussianProperties(header) ? 'splat' : 'mesh';
}

function stringList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((entry): entry is string => typeof entry === 'string');
}

function extensionsFromJson(json: unknown): GltfExtensionLists {
	const record = json && typeof json === 'object' ? json as Record<string, unknown> : {};
	return {
		extensionsUsed: stringList(record.extensionsUsed),
		extensionsRequired: stringList(record.extensionsRequired),
	};
}

export function inspectGltfExtensions(buffer: ArrayBuffer): GltfExtensionLists {
	if (buffer.byteLength >= 20) {
		const view = new DataView(buffer);
		if (view.getUint32(0, true) === GLB_MAGIC) {
			const chunkLength = view.getUint32(12, true);
			const chunkType = view.getUint32(16, true);
			if (chunkType !== GLB_JSON_CHUNK || 20 + chunkLength > buffer.byteLength) {
				return { extensionsUsed: [], extensionsRequired: [] };
			}
			const jsonText = new TextDecoder()
				.decode(new Uint8Array(buffer, 20, chunkLength))
				.replace(/\0/g, '');
			try {
				return extensionsFromJson(JSON.parse(jsonText));
			} catch {
				return { extensionsUsed: [], extensionsRequired: [] };
			}
		}
	}

	const text = new TextDecoder().decode(buffer);
	const trimmed = text.trimStart();
	if (!trimmed.startsWith('{')) {
		return { extensionsUsed: [], extensionsRequired: [] };
	}
	try {
		return extensionsFromJson(JSON.parse(trimmed));
	} catch {
		return { extensionsUsed: [], extensionsRequired: [] };
	}
}

export function gltfUsesGaussianSplatting(extensions: GltfExtensionLists): boolean {
	return extensions.extensionsUsed.includes(KHR_GAUSSIAN_SPLATTING)
		|| extensions.extensionsRequired.includes(KHR_GAUSSIAN_SPLATTING);
}

export function requiredSpzGaussianCompression(extensions: GltfExtensionLists): boolean {
	return extensions.extensionsRequired.includes(KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION);
}

export function unsupportedSpzExtensionError(): Error {
	return new Error(
		`${KHR_SPZ_GAUSSIAN_SPLATS_COMPRESSION} is not a supported glTF extension. Export uncompressed ${KHR_GAUSSIAN_SPLATTING}, or a standalone .spz file.`,
	);
}
