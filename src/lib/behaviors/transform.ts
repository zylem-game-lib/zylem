
import { defineComponent, Types } from "bitecs";

export const position = defineComponent({
	x: Types.f32,
	y: Types.f32,
	z: Types.f32
});

export const rotation = defineComponent({
	x: Types.f32,
	y: Types.f32,
	z: Types.f32,
	w: Types.f32
});

export const scale = defineComponent({
	x: Types.f32,
	y: Types.f32,
	z: Types.f32
});