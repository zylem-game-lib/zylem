import { Color, Vector2 } from 'three';
import { createGame, createStage, box, text, variableChange, makeRotatable } from '../src/api/main';

const stage1 = createStage({ variables: { totalAngle: 0 } });

const box1 = makeRotatable(await box({
	name: 'box1',
	material: {
		color: new Color('red')
	}
}));

box1.onSetup(({ me }) => {
	me.setRotation(0, 0, 0);
});

box1.onUpdate(({ me, delta }) => {
	const total = stage1.getVariable('totalAngle') ?? 0;
	const nextTotal = total + delta * 2;
	me.rotateY(nextTotal);
	stage1.setVariable('totalAngle', nextTotal);
});

const rotationsText = await text({
	name: 'rotationsText',
	text: '0',
	fontSize: 24,
	stickToViewport: true,
	screenPosition: new Vector2(200, 100),
});

stage1.onUpdate(variableChange('totalAngle', (value) => {
	const rotations = Math.round(value / (Math.PI * 2));
	rotationsText.updateText(`Rotations: ${rotations.toFixed(2)}`);
}));

const testGame = createGame({ id: 'stage-variable-test', debug: true }, stage1, box1, rotationsText);
testGame.start();