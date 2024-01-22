import { Zylem, THREE } from '../../../src/main';
import { settings } from '../settings';
const { Vector3, Color } = THREE;
const { Zone } = Zylem;
const { groundLevel } = settings;

export function Goal() {
	return {
		debug: true,
		type: Zone,
		name: 'goal',
		props: {
			hasEntered: false,
			holdLogTimer: 1,
			holdCurrent: 0,
		},
		size: new Vector3(20, 8, 20),
		setup(entity: any) {
			entity.setPosition(30, groundLevel - 2, 0);
		},
		onEnter: ({ other, gameState }) => {
			console.log('Entered: ', other);
		},
		onExit: ({ other, gameState }) => {
			console.log('Exited: ', other);
		},
		onHeld: ({ delta, other, entity: goal, gameState, heldTime }) => {
			const { holdLogTimer } = goal;
			goal.holdCurrent += delta;
			if (goal.holdCurrent > holdLogTimer) {
				console.log('Holding... ', other);
				console.log('Held time: ', heldTime);
				goal.holdCurrent = 0;
			}
		},
		update: (delta, { entity: goal }: any) => {
			if (!goal._debugMesh) {
				return;
			}
			goal._debugMesh.material.color = new Color(Color.NAMES.limegreen);
			if (goal.hasEntered) {
				goal._debugMesh.material.color = new Color(Color.NAMES.darkorange);
			}
			goal.hasEntered = false;
		},
		collision: (goal: any, other: any, { gameState }: any) => {
			if (other.name === 'player') {
				goal.hasEntered = true;
			}
		}
	}
}