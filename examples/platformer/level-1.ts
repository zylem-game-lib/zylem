import { Zylem, THREE, ZylemStage } from "../../src/main";
import { Coin } from "./game-objects/coin";
import { Goal } from "./game-objects/goal";
import { Ground } from "./ground";
import { Player } from "./player";
import { settings } from "./settings";

const { ThirdPerson } = Zylem;
const { Color, Vector3 } = THREE;
const { groundLevel } = settings;

export function LevelOne(): ZylemStage {
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
				position: { x: -10, y: 0, z: 10 }
			});
			HUD.createText({
				text: '0',
				binding: 'time',
				position: { x: 15, y: 0, z: 10 }
			});
		},
		children: ({ gameState }) => {
			const coins: any[] = [];
			for (let i = 28; i < 70; i += 2) {
				const coin = Coin({ position: new Vector3(i, groundLevel - 3, 0) });
				coins.push(coin);
			}
			return [
				Player(),
				...coins,
				Ground({ position: new Vector3(0, groundLevel, 0), rotation: new Vector3(0, 0, 0) }),
				Ground({ position: new Vector3(51, groundLevel - 6, 0), rotation: new Vector3(0, 0, 0) }),
				Ground({ position: new Vector3(-30, groundLevel + 2, 0), rotation: new Vector3(0, 0, 0) }),
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