import { Color, Vector3 } from "three";
import { camera, createStage, box } from "@zylem/game-lib";

const box1 = await box({
	size: new Vector3(10, 10, 10),
	material: { color: new Color(Color.NAMES.red) },
});

export const stage2 = createStage({
	backgroundColor: new Color(Color.NAMES.orange),
}, camera({
	position: new Vector3(0, 10, 25),
}), box1);
