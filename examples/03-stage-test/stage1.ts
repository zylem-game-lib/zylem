import { Color } from "three";
import { stage } from "../../src/api/main";
import { sphere } from "../../src/lib/entities";

const planet = await sphere({
	radius: 10,
	material: { color: new Color(Color.NAMES.blue) },
});

export const stage1 = stage({
	backgroundColor: new Color(Color.NAMES.skyblue),
}, planet);