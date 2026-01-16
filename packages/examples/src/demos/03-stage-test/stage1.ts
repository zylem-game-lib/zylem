import { Color, Vector3 } from "three";
import { createCamera, createStage, createSphere } from "@zylem/game-lib";

const planet = createSphere({
	radius: 10,
	material: { color: new Color(Color.NAMES.blue) },
});

export const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.skyblue),
}, createCamera({
	position: new Vector3(0, 10, 25),
}), planet);