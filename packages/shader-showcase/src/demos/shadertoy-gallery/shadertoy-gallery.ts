/**
 * Shadertoy Gallery — the two shaders from three.js's webgpu_shadertoy
 * example as native TSL ports, plus a live GLSL editor that runs raw
 * Shadertoy code through the runtime transpiler.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';
import { createNodeMaterialFromTSL } from '@zylem/game-lib/graphics';
import {
	createShadertoyFire,
	createShadertoyWaterNoise,
	parseShadertoy,
} from '@zylem/shaders';
import { Mesh } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { rangeControl } from '../_shared/controls';

const INITIAL_GLSL = `// Edit and press "Apply shader".
// Supported inputs: iTime, iResolution, fragCoord.
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
	vec2 uv = fragCoord.xy / iResolution.xy;
	vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0.0, 2.0, 4.0));
	fragColor = vec4(col, 1.0);
}`;

function applyMaterial(entity: any, material: unknown): void {
	entity.materials = [material];
	if (entity.mesh) {
		entity.mesh.material = material;
	}
	if (entity.group) {
		entity.group.traverse((child: unknown) => {
			if (child instanceof Mesh) {
				child.material = material as any;
			}
		});
	}
}

export default function createDemo(): ShowcaseDemo {
	const waterNoise = createShadertoyWaterNoise();
	const fire = createShadertoyFire();

	const waterBox = createBox({
		size: { x: 6, y: 6, z: 6 },
		position: { x: -8, y: 0, z: 0 },
		material: { shader: waterNoise },
	});
	const fireBox = createBox({
		size: { x: 6, y: 6, z: 6 },
		position: { x: 0, y: 0, z: 0 },
		material: { shader: fire },
	});
	const customBox = createBox({
		size: { x: 6, y: 6, z: 6 },
		position: { x: 8, y: 0, z: 0 },
		material: { shader: parseShadertoy(INITIAL_GLSL) },
	});

	for (const box of [waterBox, fireBox, customBox]) {
		let rotation = 0;
		box.onUpdate(({ me, delta }) => {
			rotation += delta * 8;
			me.setRotationDegreesY(rotation);
		});
	}

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 4, z: -20 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#0b0e14',
		},
		camera,
	);
	stage.add(waterBox);
	stage.add(fireBox);
	stage.add(customBox);

	const game = createGame(
		{
			id: 'shader-showcase-shadertoy-gallery',
		},
		stage,
	);

	return {
		game,
		description:
			'Left/middle cubes: native TSL ports of the webgpu_shadertoy example shaders. Right cube: raw Shadertoy GLSL transpiled to TSL at runtime.',
		controls: [
			rangeControl('Water noise scale', waterNoise.uniforms.scale, 1, 20, 0.5),
			rangeControl('Water noise speed', waterNoise.uniforms.speed, 0, 4, 0.05),
			rangeControl('Fire scroll speed', fire.uniforms.scrollSpeed, 0, 2, 0.0125),
			rangeControl('Fire frequency', fire.uniforms.frequency, 1, 40, 0.5),
			{
				type: 'glsl',
				label: 'Shadertoy GLSL (right cube)',
				initial: INITIAL_GLSL,
				apply: code => {
					try {
						const shader = parseShadertoy(code);
						applyMaterial(customBox, createNodeMaterialFromTSL(shader));
						return null;
					} catch (error) {
						return error instanceof Error ? error.message : String(error);
					}
				},
			},
		],
	};
}
