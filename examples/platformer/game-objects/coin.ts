import { Zylem, THREE, Howl } from '../../../src/main';
const sound = new Howl({
	src: '/assets/coin-sound.mp3',
	volume: 0.1,
	preload: true,
	rate: 3.0,
});
const { Vector3 } = THREE;
const { Sprite } = Zylem;

export function Coin({ position = new Vector3(0, 0, 0) }) {
	return {
		debug: true,
		name: `coin`,
		type: Sprite,
		sensor: true,
		collisionSize: new Vector3(0.5, 0.5, 1),
		images: [{
			name: 'coin',
			file: 'platformer/coin.png'
		}],
		setup: (entity: any) => {
			entity.setPosition(position.x, position.y, position.z);
		},
		collision: (coin: any, other: any, { gameState }: any) => {
			if (other.name === 'player') {
				sound.play();
				gameState.globals.score += 100;
				coin.destroy();
			}
		},
		destroy: () => { }
	}
}