import {
	AdditiveBlending,
	BackSide,
	Color,
	DoubleSide,
	Group,
	Matrix4,
	Mesh,
	RingGeometry,
	SphereGeometry,
	Vector3,
	type Material,
	type Texture,
} from 'three';
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import {
	abs,
	clamp,
	dot,
	float,
	fwidth,
	exp,
	sqrt,
	length,
	max,
	mix,
	normalize,
	positionGeometry,
	positionWorld,
	sin,
	smoothstep,
	texture,
	uniform,
	vec4,
	cameraPosition,
} from 'three/tsl';
import { resolvePlanet, type PlanetOptions } from './planet-config';
import { createMoonTexture, createPlanetTextures } from './planet-textures';
import { sampleMoonOrbit } from './orbit';

/** Renderer-independent visual construction, shared by the Zylem entity and GPU tests. */
export function createPlanetVisual(options: PlanetOptions = {}) {
	const config = resolvePlanet(options);
	const group = new Group();
	group.name = options.name ?? 'Zylem.Planet';
	const ownedTextures: Texture[] = [],
		materials: Material[] = [];
	const inverse = uniform(new Matrix4());
	const sun = uniform(new Vector3(...config.sunDirection).normalize());
	const localSun = uniform(sun.value.clone());
	const localPoint: any = inverse.mul(vec4(positionWorld, 1)).xyz;
	const radius = config.radius;
	const ringConfig = config.rings;
	const ringNormal = new Vector3(0, 1, 0).applyAxisAngle(
		new Vector3(0, 0, 1),
		((ringConfig ? ringConfig.tilt : 0) * Math.PI) / 180
	);
	const ringN = uniform(ringNormal);
	const ringDensity = (r: any) => {
		if (!ringConfig) return float(0);
		const t = r.sub(ringConfig.innerRadius).div(ringConfig.outerRadius - ringConfig.innerRadius);
		const detail = clamp(float(1).sub(fwidth(t).mul(50)), 0, 1);
		const bands = sin(t.mul(210))
			.mul(0.04)
			.mul(detail)
			.add(sin(t.mul(59).add(sin(t.mul(13)))).mul(0.1))
			.add(0.78);
		const gaps = smoothstep(0.012, 0.025, abs(t.sub(0.62))).mul(
			smoothstep(0.005, 0.013, abs(t.sub(0.31)))
		);
		return bands
			.mul(gaps)
			.mul(smoothstep(0, 0.025, t))
			.mul(float(1).sub(smoothstep(0.97, 1, t)))
			.mul(ringConfig.opacity);
	};
	const planetShadow = (): any => {
		const toward = dot(localPoint, localSun).negate();
		const distance = length(localPoint.add(localSun.mul(max(toward, 0))));
		return toward.greaterThan(0).select(
			smoothstep(radius * 0.98, radius * 1.025, distance)
				.mul(0.94)
				.add(0.06),
			float(1)
		);
	};
	const ringShadow = (): any => {
		if (!ringConfig) return float(1);
		const denominator = dot(localSun, ringN);
		const safeDenominator = abs(denominator).lessThan(1e-4).select(float(1e-4), denominator);
		const t = dot(localPoint, ringN).negate().div(safeDenominator);
		const hitRadius = length(localPoint.add(localSun.mul(t)));
		return t
			.greaterThan(0.001)
			.and(abs(denominator).greaterThan(1e-4))
			.select(float(1).sub(ringDensity(hitRadius).mul(0.85)), float(1));
	};
	const maps = createPlanetTextures(
		config.seed,
		options.surface?.oceanColor ?? '#075daf',
		options.surface?.landColor ?? '#454e89',
		config.oceanCoverage
	);
	ownedTextures.push(...Object.values(maps));
	const surfaceMaterial = new MeshStandardNodeMaterial({ roughness: 0.7, metalness: 0 });
	surfaceMaterial.colorNode = texture(maps.surface).rgb.mul(ringShadow());
	surfaceMaterial.roughnessNode = texture(maps.roughness).g;
	materials.push(surfaceMaterial);
	const surface = new Mesh(new SphereGeometry(radius, 128, 64), surfaceMaterial);
	surface.name = 'Planet.Surface';
	group.add(surface);
	let clouds: Mesh | undefined;
	if (options.surface?.clouds !== false) {
		const material = new MeshStandardNodeMaterial({
			map: maps.clouds,
			transparent: true,
			depthWrite: false,
			roughness: 1,
		});
		material.colorNode = texture(maps.clouds).rgb.mul(ringShadow());
		material.opacityNode = texture(maps.clouds).a;
		clouds = new Mesh(new SphereGeometry(radius * 1.009, 96, 48), material);
		clouds.name = 'Planet.Clouds';
		clouds.renderOrder = 1;
		materials.push(material);
		group.add(clouds);
	}
	if (config.atmosphere) {
		const material = new MeshBasicNodeMaterial({
			transparent: true,
			side: BackSide,
			blending: AdditiveBlending,
			depthWrite: false,
		});
		const view = normalize(cameraPosition.sub(positionWorld));
		const radial = normalize(localPoint);
		const localView = normalize(inverse.mul(vec4(view, 0)).xyz);
		const cosine = dot(radial, localView);
		const impact = length(localPoint).mul(sqrt(max(float(1).sub(cosine.mul(cosine)), 0)));
		const height = max(impact.sub(radius).div(radius * config.atmosphere.thickness), 0);
		const rim = exp(height.mul(-3)).mul(float(1).sub(smoothstep(0.7, 1, height)));
		const lit = smoothstep(-0.25, 0.7, dot(radial, localSun)).mul(0.9).add(0.03);
		material.colorNode = vec4(
			uniform(new Color(config.atmosphere.color)).mul(lit).mul(config.atmosphere.intensity),
			1
		);
		material.opacityNode = rim.mul(0.8);
		const atmosphere = new Mesh(
			new SphereGeometry(radius * (1 + config.atmosphere.thickness), 96, 48),
			material
		);
		atmosphere.name = 'Planet.Atmosphere';
		atmosphere.renderOrder = 3;
		materials.push(material);
		group.add(atmosphere);
	}
	if (ringConfig) {
		const material = new MeshStandardNodeMaterial({
			side: DoubleSide,
			transparent: true,
			depthWrite: false,
			roughness: 0.9,
		});
		material.forceSinglePass = true;
		const r = length(positionGeometry.xy);
		const density = ringDensity(r);
		material.colorNode = uniform(new Color(ringConfig.color))
			.mul(mix(0.65, 1.25, density))
			.mul(planetShadow());
		material.opacityNode = density;
		const ring = new Mesh(
			new RingGeometry(ringConfig.innerRadius, ringConfig.outerRadius, 256, 4),
			material
		);
		ring.name = 'Planet.Rings';
		ring.rotation.x = -Math.PI / 2;
		ring.renderOrder = 2;
		const plane = new Group();
		plane.rotation.z = (ringConfig.tilt * Math.PI) / 180;
		plane.add(ring);
		group.add(plane);
		materials.push(material);
	}
	const moons = config.moons.map((moon, i) => {
		const map = createMoonTexture(moon.seed ?? config.seed + i + 1);
		ownedTextures.push(map);
		const material = new MeshStandardNodeMaterial({
			roughness: 1,
			bumpMap: map,
			bumpScale: (moon.radius ?? 1) * 0.025,
		});
		material.colorNode = texture(map).rgb.mul(planetShadow()).mul(ringShadow());
		const mesh = new Mesh(new SphereGeometry(moon.radius, 48, 24), material);
		mesh.name = `Planet.Moon.${i + 1}`;
		materials.push(material);
		group.add(mesh);
		return { mesh, orbit: moon.orbit };
	});
	const syncFrame = () => {
		inverse.value.copy(group.matrixWorld).invert();
		localSun.value.copy(sun.value).transformDirection(inverse.value);
	};
	group.traverse((object) => {
		if ((object as Mesh).isMesh) object.onBeforeRender = syncFrame;
	});
	let disposed = false;
	const update = (elapsed: number) => {
		if (disposed) return;
		surface.rotation.y = config.rotationPeriod
			? (elapsed * 2 * Math.PI) / config.rotationPeriod
			: 0;
		if (clouds)
			clouds.rotation.y = config.rotationPeriod
				? (elapsed * 2 * Math.PI) / (config.rotationPeriod * 0.87)
				: 0;
		for (const moon of moons) {
			sampleMoonOrbit(moon.orbit, elapsed, moon.mesh.position);
			moon.mesh.rotation.y = (-elapsed * 2 * Math.PI) / moon.orbit.period;
		}
	};
	update(0);
	return {
		group,
		surface,
		moons,
		config,
		update,
		setSunDirection(direction: Vector3) {
			if (direction.lengthSq() < 1e-12 || !direction.toArray().every(Number.isFinite))
				throw new Error('Sun direction must be nonzero and finite.');
			sun.value.copy(direction).normalize();
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			group.removeFromParent();
			group.traverse((object) => {
				if ((object as Mesh).isMesh) (object as Mesh).geometry.dispose();
			});
			for (const material of materials) material.dispose();
			for (const map of ownedTextures) map.dispose();
			group.clear();
		},
	};
}
