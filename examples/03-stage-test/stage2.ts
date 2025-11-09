import { Color, Vector3 } from "three";
import { stage } from "../../src/main";
import { box } from "../../src/lib/entities";

const box1 = await box({
	size: new Vector3(10, 10, 10),
	material: { color: new Color(Color.NAMES.red) },
});

export const stage2 = stage({
	backgroundColor: new Color(Color.NAMES.orange),
}, box1);
