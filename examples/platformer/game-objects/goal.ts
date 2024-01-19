import { Zylem, THREE } from '../../../src/main';
const { Vector3, Color } = THREE;
const { Zone } = Zylem;

export function Goal() {
	return {
		debug: true,
		type: Zone,
		name: 'goal',
		props: {
			hasEntered: false,
		},
		size: new Vector3(20, 20, 20),
		setup(entity: any) {
			entity.setPosition(30, 0, 0);
		},
		onEnter: (other: any, { gameState }: any) => {

		},
		onExit: (other: any, { gameState }: any) => {

		},
		onHeld: (other: any, delta: number, { gameState }: any) => {

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