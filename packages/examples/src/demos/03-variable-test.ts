import { Color, Vector2 } from 'three';
import { createGame, createStage, createBox, createText, setVariable, getVariable, createVariable, onVariableChange } from '@zylem/game-lib';

const stage1 = createStage();

createVariable(stage1, 'totalAngle', 0);

const box1 = createBox({
	name: 'box1',
	material: {
		color: new Color('red')
	}
});

box1.onSetup(({ me }) => {
	me.setRotation(0, 0, 0);
});

box1.onUpdate(({ me, delta }) => {
	const total = getVariable<number>(stage1, 'totalAngle') ?? 0;
	const nextTotal = total + delta * 2;
	me.rotateY(delta * 2);
	setVariable(stage1, 'totalAngle', nextTotal);
});

const rotationsText = createText({
	name: 'rotationsText',
	text: '0',
	fontSize: 24,
	stickToViewport: true,
	screenPosition: new Vector2(200, 100),
});

// Use standalone onVariableChange
onVariableChange<number>(stage1, 'totalAngle', (value) => {
	const rotations = Math.round(value / (Math.PI * 2));
	rotationsText.updateText(`Rotations: ${rotations.toFixed(2)}`);
});

const testGame = createGame({ id: 'stage-variable-test', debug: true }, stage1, box1, rotationsText);

export default testGame;