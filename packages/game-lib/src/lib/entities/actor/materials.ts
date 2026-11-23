import { Material, Mesh, MeshStandardMaterial, Object3D } from 'three';
import type { MaterialOptions } from '../../graphics/material';
import { isGaussianSplatNode } from '../../core/loaders/gaussian-model';

type TransparentMaterial = Material & {
	opacity: number;
	transparent: boolean;
	needsUpdate: boolean;
};

/**
 * Produce a cloned material with the requested color/opacity applied.
 *
 * Cloning preserves any textures (`map`, `normalMap`, `roughnessMap`, …)
 * that came with the loaded model — colour acts as a multiplicative tint on
 * top of them, matching standard PBR behaviour. We fall back to a fresh
 * `MeshStandardMaterial` only when the source material has no `.color`
 * field (e.g. custom `ShaderMaterial`).
 */
function tintMaterial(
	source: Material,
	materialOptions: MaterialOptions,
): Material {
	const hasColorField = 'color' in source;
	const wantsColor = Boolean(materialOptions.color);
	const wantsOpacity = materialOptions.opacity !== undefined;

	if (!wantsColor && !wantsOpacity) {
		return source;
	}

	if (wantsColor && !hasColorField) {
		const replacement = new MeshStandardMaterial({
			color: materialOptions.color!,
			emissiveIntensity: 0.5,
			lightMapIntensity: 0.5,
			fog: true,
			opacity: materialOptions.opacity ?? 1,
			transparent: wantsOpacity && materialOptions.opacity! < 1,
		});
		return replacement;
	}

	const cloned = source.clone();
	if (wantsColor && 'color' in cloned) {
		(cloned as unknown as { color: { copy: (c: unknown) => void } }).color
			.copy(materialOptions.color!);
	}
	if (wantsOpacity && 'opacity' in cloned && 'transparent' in cloned) {
		const transparentMaterial = cloned as TransparentMaterial;
		transparentMaterial.opacity = materialOptions.opacity!;
		transparentMaterial.transparent = materialOptions.opacity! < 1;
	}
	(cloned as TransparentMaterial).needsUpdate = true;
	return cloned;
}

export function applyActorMaterialOverrides(
	object: Object3D | null,
	materialOptions: MaterialOptions | undefined,
): void {
	if (
		!materialOptions
		|| (!materialOptions.color && !materialOptions.path && materialOptions.opacity === undefined)
	) {
		return;
	}

	if (!object) {
		return;
	}

	object.traverse((child) => {
		if (!(child as Mesh).isMesh || isGaussianSplatNode(child)) {
			return;
		}

		const mesh = child as Mesh;

		mesh.material = Array.isArray(mesh.material)
			? mesh.material.map((material) => tintMaterial(material, materialOptions))
			: tintMaterial(mesh.material, materialOptions);

		if (materialOptions.color) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
	});
}
