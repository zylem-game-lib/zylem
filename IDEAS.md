# API

## Future API considerations

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
