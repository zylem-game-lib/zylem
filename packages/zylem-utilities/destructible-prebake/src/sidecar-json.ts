import type {
	PlainFractureOptions,
	PlainWorkerFragmentPayload,
	PrebakeWorkerResponse,
} from '@zylem/game-lib/behavior/destructible-3d/prebake-build';

/**
 * v1 on-disk format: base64 attribute blobs (JSON-safe).
 */
export type DestructiblePrebakeSidecarV1 = {
	schemaVersion: 1;
	fractureCacheKey: string;
	sourceSha256: string;
	sourceGlbPath: string;
	plainFractureOptions: PlainFractureOptions;
	fragments: EncodedFragmentV1[];
};

export type EncodedFragmentV1 = {
	position: [number, number, number];
	quaternion: [number, number, number, number];
	scale: [number, number, number];
	attributes: Record<
		string,
		{
			itemSize: number;
			normalized?: boolean;
			dataBase64: string;
		}
	>;
};

function encodeAttributeArrayBuffer(buffer: ArrayBuffer): string {
	return Buffer.from(buffer).toString('base64');
}

/**
 * Converts a worker-style response into JSON-serializable sidecar fragments.
 */
export function encodePrebakeResponseToSidecarFragments(
	response: PrebakeWorkerResponse,
): EncodedFragmentV1[] {
	return response.fragments.map((fragment) =>
		encodeFragmentPayload(fragment),
	);
}

function encodeFragmentPayload(
	fragment: PlainWorkerFragmentPayload,
): EncodedFragmentV1 {
	const attributes: EncodedFragmentV1['attributes'] = {};
	for (const [name, spec] of Object.entries(fragment.attributes)) {
		const attr = spec as PlainWorkerFragmentPayload['attributes'][string];
		attributes[name] = {
			itemSize: attr.itemSize,
			...(attr.normalized !== undefined ? { normalized: attr.normalized } : {}),
			dataBase64: encodeAttributeArrayBuffer(attr.array),
		};
	}

	return {
		position: tuple3(fragment.position),
		quaternion: tuple4(fragment.quaternion),
		scale: tuple3(fragment.scale),
		attributes,
	};
}

function tuple3(t: [number, number, number]): [number, number, number] {
	return [t[0], t[1], t[2]];
}

function tuple4(t: [number, number, number, number]): [number, number, number, number] {
	return [t[0], t[1], t[2], t[3]];
}

export function buildSidecarV1(input: {
	fractureCacheKey: string;
	sourceSha256: string;
	sourceGlbPath: string;
	plainFractureOptions: PlainFractureOptions;
	response: PrebakeWorkerResponse;
}): DestructiblePrebakeSidecarV1 {
	return {
		schemaVersion: 1,
		fractureCacheKey: input.fractureCacheKey,
		sourceSha256: input.sourceSha256,
		sourceGlbPath: input.sourceGlbPath,
		plainFractureOptions: input.plainFractureOptions,
		fragments: encodePrebakeResponseToSidecarFragments(input.response),
	};
}
