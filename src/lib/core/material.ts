import { Color, Material, MeshPhongMaterial, MeshStandardMaterial, RepeatWrapping, ShaderMaterial, TextureLoader, Vector2 } from "three";
import fragmentShader from '../rendering/shaders/fragment/pixelated.fx?raw';
import vertexShader from '../rendering/shaders/vertex/standard.fx?raw';

const shaderDictionary = {
	test: {
		vertexShader,
		fragmentShader
	}
}

export class ZylemMaterial {
	materials: Material[] = [];

	applyTexture(texturePath: string, repeat: Vector2 = new Vector2(1, 1)) {
		const loader = new TextureLoader();
		const texture = loader.load(texturePath);
		texture.repeat = repeat;
		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		const material = new MeshPhongMaterial({
			map: texture,
		});
		this.materials.push(material);
	}

	applyMaterial(color: Color) {
		const material = new MeshStandardMaterial({
			color: color,
			emissiveIntensity: 0.5,
			lightMapIntensity: 0.5,
			fog: true,
		});
		if (!this.materials) {
			this.materials = [];
		}
		this.materials.push(material);
	}

	applyShader(shaderName: 'test', customShader: string) {
		const { vertexShader, fragmentShader } = shaderDictionary[shaderName];
		const shader = new ShaderMaterial({
			vertexShader,
			fragmentShader
		});
		this.materials.push(shader);
	}
}