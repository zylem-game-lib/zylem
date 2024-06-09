import { THREE } from '../../src/main';
import { boardHeight, boardWidth } from './board';

import { Sprite } from "../../src/lib/entities";
const { Vector3 } = THREE;

// TODO: write mappings in engine
const kXSM = 4;
const kSM = 3;
const kM2 = 2;
const kM = 1;
const kL = 0;

const resolveRockSize = (health: number, variant: number) => {
	switch (health) {
		case 1:
			return kXSM;
		case 2:
			return kSM;
		case 3:
			return (variant > 1) ? kM2 : kM;
		case 4:
			return kL;
		default:
			return null;
	}
}

export function Rock({ x = 0, y = 0, startingHealth = 4 }) {
	const rockVariant = Math.floor(Math.random() * 2);
	return Sprite({
		name: `rock`,
		size: new Vector3(startingHealth * 0.5, startingHealth * 0.5, startingHealth),
		images: [
			{
				name: 'idle',
				file: 'asteroids/rock-large.png'
			},
			{
				name: 'idle',
				file: 'asteroids/rock-medium.png'
			},
			{
				name: 'idle',
				file: 'asteroids/rock-medium.png'
			},
			{
				name: 'idle',
				file: 'asteroids/rock-small.png'
			},
			{
				name: 'idle',
				file: 'asteroids/rock-x-small.png'
			}
		],
		custom: {
			health: startingHealth,
			variant: rockVariant,
			hit: false,
			hitCooldown: 1,
			velX: 0,
			velY: 0,
		},
		setup: ({ entity }) => {
			entity.setPosition(x, y, 1);
			const speed = 5 - (entity as any).health;
			const randX = Math.random() * speed * (Math.random() * 1 > 0.5 ? -1 : 1);
			const randY = Math.random() * speed * (Math.random() * 1 > 0.5 ? -1 : 1);
			(entity as any).velX = randX;
			(entity as any).velY = randY;
		},
		update: ({ delta, entity: asteroid }: any) => {
			const { health, variant, hit, hitCooldown, velX, velY } = asteroid;
			const { x, y } = asteroid.getPosition();
			const image = resolveRockSize(health, variant);
			asteroid.sprites.forEach((sprite: any) => {
				sprite.visible = false;
			});
			asteroid.moveXY(velX, velY);
			if (image !== null) {
				asteroid.sprites[image].visible = true;
				asteroid.sprites[image].scale.set(health, health, .5);
			} else {
				asteroid.destroy();
			}
			asteroid.hitCooldown += delta;
			asteroid.wrapAroundXY(boardWidth, boardHeight);
			if (hit && hitCooldown >= 1) {
				asteroid.health--;
				asteroid.hit = false;
				for (let i = health - 1; i > 0; i--) {
					const randX = Math.random() * i * 0.5 * (Math.random() * 1 > 0.5 ? -1 : 1);
					const randY = Math.random() * i * 0.5 * (Math.random() * 1 > 0.5 ? -1 : 1);
					asteroid.spawn(Rock, { x: x + randX, y: y + randY, startingHealth: health - 1 });
				}
				asteroid.hitCooldown = 0;
			}
		},
		collision: (asteroid: any, other: any, globals) => {
			const { lives } = globals;
			if (asteroid.health < 1) {
				asteroid.destroy();
			}
			if (asteroid.health >= 1 && asteroid.hitCooldown >= 1 && other.name === 'ship') {
				const newLives = lives.get() - 1;
				lives.set(newLives);
				asteroid.hit = true;
			}
		}
	})
}