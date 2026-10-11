import { createGame } from '@zylem/game-lib/core';
import { createCooldownIcon, createRect, createText } from '@zylem/game-lib/entity';

const panel = createRect({
	name: 'hud-panel',
	width: 160,
	height: 48,
	fillColor: '#00000088',
	strokeColor: '#ffffff',
	strokeWidth: 2,
	radius: 6,
	screenPosition: { x: 12, y: 12 },
	stickToViewport: true,
});

const label = createText({
	name: 'hud-label',
	text: 'Ready',
	screenPosition: { x: 24, y: 28 },
	stickToViewport: true,
});

const portrait = createRect({
	name: 'hud-portrait',
	shape: 'ellipse',
	width: 64,
	height: 64,
	image: '/assets/ui/hero.png',
	strokeColor: '#ffffff',
	strokeWidth: 2,
	screenAnchor: 'top-right',
	screenPosition: { x: -12, y: 12 },
});

const attackIcon = createCooldownIcon({
	name: 'attack-icon',
	cooldown: 'attack',
	icon: '/assets/ui/sword.png',
	screenAnchor: 'bottom-center',
	screenPosition: { x: 0, y: -16 },
	iconSize: 'md',
});

createGame(panel, label, portrait, attackIcon).start();
