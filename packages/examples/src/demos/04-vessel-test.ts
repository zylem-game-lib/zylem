import { createGame, vessel, createStage, text, createGlobal, getGlobal, setGlobal } from '@zylem/game-lib';
import marsSurfacePath from '@zylem/assets/3d/textures/mars-surface.jpg';
import { Vector2 } from 'three';

createGlobal('vesselCounter', 0);

const testVessel = vessel()
	.onSetup((params: any) => {
		const vesselCounter = getGlobal('vesselCounter') as number;
		vesselTextSetup.updateText(`Vessel was setup ${Math.ceil(vesselCounter)}`);
	})
	.onUpdate((params: any) => {
		let vesselCounter = getGlobal('vesselCounter') as number;
		vesselCounter += params.delta;
		setGlobal('vesselCounter', vesselCounter);
		vesselTextUpdate.updateText(`Vessel was updated ${Math.ceil(vesselCounter)}`);
	});

const vesselTextSetup = await text({
	text: '',
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.25),
});

const vesselText = await text({
	text: 'Hello World',
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.5),
});

const vesselTextUpdate = await text({
	text: '',
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.75),
});

const stage1 = createStage({ backgroundImage: marsSurfacePath });
const testGame = createGame(
	{ id: 'zylem', debug: true, globals: { vesselCounter: 0 } },
	stage1,
	testVessel,
	vesselText,
	vesselTextSetup,
	vesselTextUpdate,
);

export default testGame;
