import { THREE, Howl } from '../../../src/main';
const sound = new Howl({
	src: '/assets/coin-sound.mp3',
	volume: 0.1,
	preload: true,
	rate: 3.0,
});
const { Vector3 } = THREE;
import { Sprite } from "../../../src/lib/entities";

export function Coin({ position = new Vector3(0, 0, 0) }) {
	return Sprite({
		name: `coin`,
		collisionSize: new Vector3(0.5, 0.5, 1),
		images: [{
			name: 'coin',
			file: 'platformer/coin.png'
		}],
		setup: ({ entity }) => {
			entity.setPosition(position.x, position.y, position.z);
		},
		collision: (coin: any, other: any, globals) => {
			const { score } = globals;
			if (other.name === 'player') {
				sound.play();
				score.set(score.get() + 100);
				coin.destroy();
			}
		},
	})
}