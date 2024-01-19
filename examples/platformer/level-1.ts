import { Zylem, THREE } from "../../src/main";
import { Coin } from "./game-objects/coin";
import { Goal } from "./game-objects/goal";
import { Ground } from "./ground";
import { Player } from "./player";

const { ThirdPerson } = Zylem;
const { Color, Vector3 } = THREE;

export function LevelOne() {
	return {
		id: 'level-1',
		perspective: ThirdPerson,
		gravity: new Vector3(0, -10, 0),
		backgroundColor: new Color(0xA1ADFF),
		conditions: [
			(globals, game) => {
				if (globals.lives <= 0) {
					game.reset();
				}
			}
		],
		setup: ({ scene, HUD }) => {
			HUD.createText({
				text: '0',
				binding: 'score',
				position: { x: -10, y: 10, z: 10 }
			});
			HUD.createText({
				text: '0',
				binding: 'time',
				position: { x: 15, y: 10, z: 10 }
			});
		},
		children: ({ gameState }) => {
			const coins: any[] = [];
			for (let i = 12; i < 54; i += 2) {
				const coin = Coin({ position: new Vector3(i, 0, 0) });
				coins.push(coin);
			}
			return [
				Player(),
				...coins,
				Ground({}),
				Ground({ position: new Vector3(30, -4, 0), rotation: new Vector3(0, 0, 0) }),
				Ground({ position: new Vector3(-30, -4, 0), rotation: new Vector3(0, 0, 0) }),
				Goal()
			];
		},
		update: (delta, { camera, stage, inputs, globals }) => {
			const player = stage.getEntityByName('player');
			const { x, y } = player.getPosition();
			camera.moveCamera(new Vector3(x, y, 0));
			const { actualTime } = globals;
			globals.actualTime = actualTime + delta;
			globals.time = Math.round(actualTime);
		}
	}
};