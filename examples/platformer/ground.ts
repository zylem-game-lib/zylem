import { THREE } from "../../src/main";
import { box } from "../../src/lib/entities";

const { Vector3, Color } = THREE;

export function Ground({ position = new Vector3(0, 0, 0), rotation = new Vector3(0, 0, 0) }) {
	return box({
		name: `ground`,
		static: true,
		size: new Vector3(50, 2, 5),
		color: new Color(Color.NAMES.yellowgreen),
		setup: ({ entity }) => {
			entity.setPosition(position.x, position.y, position.z);
			entity.setRotation(rotation.x, rotation.y, rotation.z);
		}
	})
}