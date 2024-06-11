import { THREE, zone } from '../../../src/main';
import { settings } from '../settings';
const { Vector3, Color } = THREE;
const { groundLevel } = settings;

export function Goal() {
	return zone({
		name: 'goal',
		custom: {
			hasEntered: false,
			holdLogTimer: 1,
			holdCurrent: 0,
		},
		size: new Vector3(20, 8, 20),
		setup({ entity }) {
			entity.setPosition(30, groundLevel - 2, 0);
		},
		onEnter: ({ other }) => {
			console.log('Entered: ', other);
		},
		onExit: ({ other }) => {
			console.log('Exited: ', other);
		},
		onHeld: ({ delta, other, entity: goal, heldTime }) => {
			const { holdLogTimer } = goal as any;
			(goal as any).holdCurrent += delta;
			if ((goal as any).holdCurrent > holdLogTimer) {
				console.log('Holding... ', other);
				console.log('Held time: ', heldTime);
				(goal as any).holdCurrent = 0;
			}
		},
		update: ({ entity: goal }: any) => {
			if (!goal._debugMesh) {
				return;
			}
			goal._debugMesh.material.color = new Color(Color.NAMES.limegreen);
			if (goal.hasEntered) {
				goal._debugMesh.material.color = new Color(Color.NAMES.darkorange);
			}
			goal.hasEntered = false;
		},
		collision: (goal: any, other: any) => {
			if (other.name === 'player') {
				goal.hasEntered = true;
			}
		}
	})
}