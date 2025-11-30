import { Color, Vector3 } from "three";
import { camera, createStage, sphere } from "@zylem/game-lib";

const planet = await sphere({
	radius: 10,
	material: { color: new Color(Color.NAMES.blue) },
});

export const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.skyblue),
}, camera({
	position: new Vector3(0, 10, 25),
}), planet);