import { game, stage, box } from '../../src/main';

const test = box();

const example = game(
	{ debug: true },
	stage(),
	box({
		update: ({ entity: cube, inputs }) => {
			const { horizontal, vertical } = inputs[0];
			cube.moveXY(horizontal * 5, -vertical * 5);
		}
	}),
	box({
		update: ({ entity: cube, inputs }) => {
			const { horizontal, vertical } = inputs[0];
			cube.moveXY(-horizontal * 5, vertical * 5);
		}
	}),
	test
);

example.start();

/**
 * 

box({ x: 0, y: 0, z: 0, width: 1, height: 1, depth: 1, color: 'red' });
box().set({ x: 0, y: 0, z: 0, width: 1, height: 1, depth: 1, color: 'red' });
box().set('x', 0).set('y', 0);
box(box(), box(), box());
box.set('rotationY', 90);

node() should create an empty node (basically an object with an entity id, an empty children array, and update/setup/destroy functions)
node({ x: 0, y: 0, z: 0 }) should create a node with custom properties (x, y, z)
node(box(), box(), box()) should create a node with children that are default boxes
node({ x: 0, y: 0, z: 0 }, box(), box(), box()) should create a node with custom properties and children that are default boxes
node(box(), { x: 0, y: 0, z: 0 }, box(), box()) should create a node with children that are default boxes and a custom box
node({ x: 0, y: 0, z: 0 }).update(({ entity, delta }) => {
	entity.set('x', delta);
	entity.set('y', delta);
	entity.set('z', delta);
});
node().setup(({ entity, globals, HUD, camera, game }) => {
	entity.set('x', 0);
	entity.set('y', 0);
	entity.set('z', 0);
}).update(({ entity, delta }) => {
	entity.set('x', delta);
	entity.set('y', delta);
	entity.set('z', delta);
});

 */