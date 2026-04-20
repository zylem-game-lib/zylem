import {
	Color,
	Material,
	Mesh,
	MeshStandardMaterial,
	NoColorSpace,
	RepeatWrapping,
	SRGBColorSpace,
	Texture,
	TextureLoader,
} from 'three';

/**
 * A Tripo-style PBR texture triple extracted from a `.glb`:
 * - `map` → albedo / base colour (sRGB)
 * - `normalMap` → tangent-space normal (linear)
 * - `ormMap` → packed Occlusion(R) / Roughness(G) / Metallic(B) (linear)
 */
export type PbrTextures = {
	map: Texture;
	normalMap: Texture;
	ormMap: Texture;
};

export interface PbrTextureUrls {
	baseColor: string;
	normal: string;
	orm: string;
}

/**
 * Knobs for tuning how bright/shiny a PBR character reads under a stage's
 * lights. `MeshStandardMaterial` with `metalness: 1.0` looks nearly black
 * without a scene environment map (metals have no diffuse term, so they need
 * something to reflect). Until the engine ships an IBL environment, these
 * defaults dampen the metallic response and add a small emissive lift so
 * armour reads cleanly under plain ambient + directional lights.
 */
export interface PbrMaterialOptions {
	/** 0.0 = matte paint, 1.0 = full physical metal. Default: 0.35. */
	metalness?: number;
	/** 0.0 = mirror, 1.0 = rough. Default: 0.85. */
	roughness?: number;
	/** Multiplier for any scene envMap reflections. Default: 1.2. */
	envMapIntensity?: number;
	/**
	 * How much the base colour self-illuminates in shadow. 0 = realistic,
	 * ~0.3-0.5 = nicely readable without an IBL. Default: 0.35.
	 */
	emissiveIntensity?: number;
}

export const DEFAULT_PBR_MATERIAL_OPTIONS: Required<PbrMaterialOptions> = {
	metalness: 0.35,
	roughness: 0.85,
	envMapIntensity: 1.2,
	emissiveIntensity: 0.35,
};

/**
 * Build a memoised loader for a Tripo-style texture triple.
 *
 * Each character class calls this once at module scope to get a function that
 * returns the same `PbrTextures` promise on every invocation — so spawning
 * twenty healers loads the three JPGs once, not twenty times.
 */
export function createPbrTextureLoader(
	urls: PbrTextureUrls,
): () => Promise<PbrTextures> {
	let cached: Promise<PbrTextures> | null = null;
	return () => {
		if (cached) return cached;
		const loader = new TextureLoader();
		cached = Promise.all([
			loader.loadAsync(urls.baseColor),
			loader.loadAsync(urls.normal),
			loader.loadAsync(urls.orm),
		]).then(([map, normalMap, ormMap]) => {
			map.colorSpace = SRGBColorSpace;
			normalMap.colorSpace = NoColorSpace;
			ormMap.colorSpace = NoColorSpace;
			for (const t of [map, normalMap, ormMap]) {
				t.wrapS = RepeatWrapping;
				t.wrapT = RepeatWrapping;
				t.needsUpdate = true;
			}
			return { map, normalMap, ormMap };
		});
		return cached;
	};
}

type Traversable = {
	traverse: (cb: (child: unknown) => void) => void;
};

/**
 * Swap every mesh on `root` for a PBR `MeshStandardMaterial` wired to the
 * Tripo texture pack.
 *
 * - `uv2` is populated from `uv` so `aoMap` samples the same coordinates
 *   (FBX meshes typically ship with a single UV set).
 * - The previous material is disposed to avoid leaking GL resources when we
 *   replace the one the FBX loader produced.
 * - `tint` multiplies the base colour (pass white for raw textures).
 */
export function applyPbrMaterial(
	root: Traversable | null | undefined,
	textures: PbrTextures,
	tint: Color,
	options: Required<PbrMaterialOptions>,
): void {
	if (!root) return;
	const emissive = tint.clone();
	root.traverse((child) => {
		if (!(child as { isMesh?: boolean }).isMesh) return;

		const mesh = child as Mesh;
		const geom = mesh.geometry;
		if (geom?.attributes?.uv && !geom.attributes.uv2) {
			geom.setAttribute('uv2', geom.attributes.uv);
		}

		const previous = mesh.material;
		const replacement = new MeshStandardMaterial({
			map: textures.map,
			normalMap: textures.normalMap,
			roughnessMap: textures.ormMap,
			metalnessMap: textures.ormMap,
			aoMap: textures.ormMap,
			color: tint,
			roughness: options.roughness,
			metalness: options.metalness,
			envMapIntensity: options.envMapIntensity,
			emissive,
			emissiveMap: textures.map,
			emissiveIntensity: options.emissiveIntensity,
		});

		mesh.material = replacement;
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		if (Array.isArray(previous)) {
			previous.forEach((m) => (m as Material)?.dispose?.());
		} else {
			(previous as Material | undefined)?.dispose?.();
		}
	});
}

export function resolvePbrOptions(
	overrides: PbrMaterialOptions | undefined,
	defaults: Required<PbrMaterialOptions> = DEFAULT_PBR_MATERIAL_OPTIONS,
): Required<PbrMaterialOptions> {
	return { ...defaults, ...(overrides ?? {}) };
}
