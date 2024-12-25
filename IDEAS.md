# API

## Future API considerations

```typescript
box({ x: 0, y: 0, z: 0, width: 1, height: 1, depth: 1, color: 'red' });
box().set({ x: 0, y: 0, z: 0, width: 1, height: 1, depth: 1, color: 'red' });
box().set('x', 0).set('y', 0);
box(box(), box(), box());
box.set('rotationY', 90);

node() // should create an empty node (basically an object with an entity id, an empty children array, and update/setup/destroy functions)
node({ x: 0, y: 0, z: 0 }) // should create a node with custom properties (x, y, z)
node(box(), box(), box()) // should create a node with children that are default boxes
node({ x: 0, y: 0, z: 0 }, box(), box(), box()) // should create a node with custom properties and children that are default boxes
node(box(), { x: 0, y: 0, z: 0 }, box(), box()) // should create a node with children that are default boxes and a custom box
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

```

> something similar to kaboomjs

```typescript

hud.add(UIBar(), UILabel())
stage.add(actor(), box())
stage.update = ({ children, stage }) => {
}
HUD.addLabel({})
HUD.addBar({})

interface MethodsConfig {
    setup: () => any;
    update: (params: any) => void;
    destroy: () => void;
}

// Helper type to check if MethodsConfig is present in T
type HasMethodsConfig<T> = T extends [MethodsConfig, ...any[]] ? true : false;

// Entity function interface
interface EntityFunction {
    <T extends any[]>(...args: T): HasMethodsConfig<T> extends true ? MethodsConfig : void;
}

const entity: EntityFunction = (...args: any[]) => {
 if (args.some(arg => 'setup' in arg && 'update' in arg && 'destroy' in arg)) {
        // MethodsConfig is present
        return args.find(arg => 'setup' in arg && 'update' in arg && 'destroy' in arg) as MethodsConfig;
    }
}

interface BoxParameters {
 size: Vector3;
}

function box(obj) {

}

const testBox = entity(
 box({
  size: new Vector3(1,1,1)
 }),
 {
  setup: () => {
   return this;
  },
  update: ({ }) => {

  },
  destroy:() => {

  },
 } as MethodsConfig
);
```
