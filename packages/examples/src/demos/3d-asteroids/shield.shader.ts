import { objectVertexShader } from '@zylem/game-lib';

const fragment = `
precision highp float;

uniform float iTime;
varying vec2 vUv;

float ring(vec2 uv, float radius, float thickness) {
	float dist = distance(uv, vec2(0.5));
	float outer = smoothstep(radius + thickness, radius, dist);
	float inner = smoothstep(radius, radius - thickness, dist);
	return outer * inner;
}

void main() {
	vec2 uv = vUv;
	vec2 centered = uv - 0.5;
	float dist = length(centered);

	float edgeGlow = smoothstep(0.42, 0.18, dist) * (1.0 - smoothstep(0.18, 0.0, dist));
	float pulse = 0.7 + 0.3 * sin(iTime * 10.0);
	float sweepA = sin((uv.y * 24.0) - (iTime * 7.0));
	float sweepB = sin((uv.x * 18.0) + (iTime * 5.5));
	float energyBands = smoothstep(0.45, 1.0, sweepA * 0.65 + sweepB * 0.35);
	float concentric = ring(uv, 0.33 + 0.015 * sin(iTime * 4.0), 0.035);
	float halo = smoothstep(0.48, 0.22, dist) * 0.18;

	float alpha = edgeGlow * (0.45 + energyBands * 0.45) * pulse;
	alpha += concentric * 0.4;
	alpha += halo;
	alpha *= smoothstep(0.5, 0.08, dist);

	vec3 base = vec3(0.08, 0.52, 1.0);
	vec3 glow = vec3(0.55, 0.9, 1.0);
	vec3 color = mix(base, glow, energyBands * 0.7 + concentric * 0.3);

	gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.78));
}
`;

export const shipShieldShader = {
	vertex: objectVertexShader,
	fragment,
};
