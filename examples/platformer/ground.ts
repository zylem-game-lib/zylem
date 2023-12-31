import { Zylem, THREE } from "../../src/main";

const { Box } = Zylem;
const { Vector3, Color } = THREE;

export function Ground(position = new Vector3(0, -6, 0)) {
	return {
		name: `ground`,
		type: Box,
		static: true,
		size: new Vector3(50, 2, 1),
		color: Color.NAMES.yellowgreen,
		props: {},
		setup: (entity: any) => {
			entity.setPosition(position.x, position.y, position.z);
		},
		update: (_delta: number, { entity, inputs }: any) => {
		},
	}
}