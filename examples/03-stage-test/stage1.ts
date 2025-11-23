import { Color } from "three";
import { createStage, sphere } from "@zylem/game-lib";

const planet = await sphere({
	radius: 10,
	material: { color: new Color(Color.NAMES.blue) },
});

export const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.skyblue),
}, planet);