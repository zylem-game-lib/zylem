import { createGame, vessel, createStage, text } from '@zylem/game-lib';
import marsSurfacePath from '@zylem/assets/3d/textures/mars-surface.jpg';
import { Vector2 } from 'three';

const testVessel = vessel();
let vesselCounter = 0;
testVessel.setup = (params: any) => {
	vesselCounter = 0;
	vesselTextSetup.updateText(`Vessel was setup ${Math.ceil(vesselCounter)}`);
}
testVessel.update = (params: any) => {
	vesselCounter += params.delta;
	vesselTextUpdate.updateText(`Vessel was updated ${Math.ceil(vesselCounter)}`);
}
testVessel.destroy = (params: any) => {
	vesselTextSetup.updateText(`Vessel was destroyed ${Math.ceil(vesselCounter)}`);
}

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
	{ id: 'zylem', debug: true },
	stage1,
	testVessel,
	vesselText,
	vesselTextSetup,
	vesselTextUpdate,
);

export default testGame;
