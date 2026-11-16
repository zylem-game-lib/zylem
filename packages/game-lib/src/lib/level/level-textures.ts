/**
 * Textures and materials for the level's solids.
 *
 * A face names its texture by id: `builtin:<key>` for the generated ones, or
 * the id of an image stored in the level document. Each id becomes one Three
 * texture, and each texture and look one material, shared by every mesh that
 * shows it and kept across rebuilds. The session disposes the lot on close.
 */

import {
	Color,
	DataTexture,
	DoubleSide,
	LinearFilter,
	LinearMipmapLinearFilter,
	MeshStandardMaterial,
	RGBAFormat,
	RepeatWrapping,
	SRGBColorSpace,
	TextureLoader,
	UnsignedByteType,
	type Material,
	type Texture,
} from 'three';
import {
	BUILTIN_TEXTURE_SIZE,
	builtinTextureKey,
	builtinTexturePixels,
	type BuiltinTextureKey,
	type LevelTexture,
} from '@zylem/bridge';

/** How a solid is drawn apart from its textures. */
export interface BrushLook {
	selected?: boolean;
	/** The sector color, or a clip half's. */
	tint?: string | null;
}

/** A bare face. */
const DEFAULT_BRUSH_COLOR = 0xc8c2b4;
/** Lighter than the default so a selected solid still reads as chosen. */
const SELECTED_BRUSH_COLOR = 0xe4ddd0;
/** Added to a textured face of a selected solid, which has no base color to lighten. */
const SELECTED_GLOW = 0x2e2a22;
/** Sharper at the grazing angles floors are seen from. */
const ANISOTROPY = 4;

/** Set on materials this cache owns, so a mesh being torn down leaves them alone. */
export const SHARED_MATERIAL = 'levelShared';

interface LoadedTexture {
	texture: Texture;
	/** The data URL it was loaded from; empty for a built-in. */
	source: string;
}

function tile(texture: Texture): Texture {
	texture.wrapS = RepeatWrapping;
	texture.wrapT = RepeatWrapping;
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = ANISOTROPY;
	return texture;
}

/** The generated pixels as a texture. Rows are turned over: a texture's first row is its bottom. */
function builtinTexture(key: BuiltinTextureKey): Texture {
	const size = BUILTIN_TEXTURE_SIZE;
	const pixels = builtinTexturePixels(key, size);
	const row = size * 4;
	const flipped = new Uint8Array(pixels.length);
	for (let y = 0; y < size; y += 1) {
		flipped.set(pixels.subarray(y * row, (y + 1) * row), (size - 1 - y) * row);
	}
	const texture = new DataTexture(flipped, size, size, RGBAFormat, UnsignedByteType);
	texture.generateMipmaps = true;
	texture.minFilter = LinearMipmapLinearFilter;
	texture.magFilter = LinearFilter;
	texture.needsUpdate = true;
	return tile(texture);
}

export class LevelTextures {
	private library = new Map<string, LevelTexture>();
	private textures = new Map<string, LoadedTexture>();
	private materials = new Map<string, MeshStandardMaterial>();
	private loader: TextureLoader | null = null;

	/**
	 * The images the document carries. A texture whose image is gone or
	 * replaced is dropped, with the materials that showed it.
	 */
	setLibrary(textures: readonly LevelTexture[] | undefined): void {
		this.library.clear();
		for (const texture of textures ?? []) this.library.set(texture.id, texture);
		for (const [id, loaded] of this.textures) {
			if (builtinTextureKey(id)) continue;
			if (this.library.get(id)?.dataUrl !== loaded.source) this.drop(id);
		}
	}

	/** The texture for an id, or `null` for an id the level does not have. */
	texture(textureId: string): Texture | null {
		const loaded = this.textures.get(textureId);
		if (loaded) return loaded.texture;
		const key = builtinTextureKey(textureId);
		if (key) {
			const texture = builtinTexture(key);
			this.textures.set(textureId, { texture, source: '' });
			return texture;
		}
		const image = this.library.get(textureId);
		if (!image) return null;
		// The texture is usable at once and fills in when the image decodes.
		this.loader ??= new TextureLoader();
		const texture = tile(this.loader.load(image.dataUrl));
		this.textures.set(textureId, { texture, source: image.dataUrl });
		return texture;
	}

	/**
	 * The material for faces showing `textureId`, or bare faces for `null` or
	 * an unknown id. Faces sit a hair back in depth so edge lines drawn on
	 * them win the depth test.
	 */
	material(textureId: string | null, look: BrushLook = {}): MeshStandardMaterial {
		const map = textureId ? this.texture(textureId) : null;
		const selected = look.selected === true;
		const tint = look.tint ?? null;
		const key = `${map ? textureId : ''}|${selected ? 1 : 0}|${tint ?? ''}`;
		const cached = this.materials.get(key);
		if (cached) return cached;

		const bare = selected ? SELECTED_BRUSH_COLOR : DEFAULT_BRUSH_COLOR;
		const material = new MeshStandardMaterial({
			color: tint ?? (map ? 0xffffff : bare),
			map,
			side: DoubleSide,
			polygonOffset: true,
			polygonOffsetFactor: 1,
			polygonOffsetUnits: 1,
		});
		if (tint && selected) material.color.lerp(new Color(0xffffff), 0.35);
		if (map && selected && !tint) material.emissive.set(SELECTED_GLOW);
		material.userData[SHARED_MATERIAL] = true;
		this.materials.set(key, material);
		return material;
	}

	/**
	 * The materials for a brush geometry, one per slot; see `geometryTextures`.
	 * A geometry with one slot takes that material alone.
	 */
	materialsFor(
		textureIds: ReadonlyArray<string | null>,
		look: BrushLook = {},
	): Material | Material[] {
		const materials = textureIds.map((textureId) => this.material(textureId, look));
		return materials.length === 1 ? materials[0]! : materials;
	}

	dispose(): void {
		for (const material of this.materials.values()) material.dispose();
		this.materials.clear();
		for (const loaded of this.textures.values()) loaded.texture.dispose();
		this.textures.clear();
		this.library.clear();
	}

	private drop(textureId: string): void {
		const loaded = this.textures.get(textureId);
		if (!loaded) return;
		for (const [key, material] of this.materials) {
			if (material.map !== loaded.texture) continue;
			material.dispose();
			this.materials.delete(key);
		}
		loaded.texture.dispose();
		this.textures.delete(textureId);
	}
}
