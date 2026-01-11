# Game API

```typescript
export declare function createGame<TGlobals extends BaseGlobals>(
  ...options: GameOptions<TGlobals>
): Game<TGlobals>;
```

## Game Instance API

game.add(Stage | Entity | Configuration)
game.remove(Stage | Entity | Configuration)

game.load((payload: GamePayload) => {})
game.start()
game.reset()
game.pause()
game.end()

game.previousStage()
game.nextStage()
game.goToStage(stageId: string)

### Lifecycle API

game.onSetup(context: GameContext)
game.onLoaded(context: GameContext)
game.onUpdate(context: GameContext)
game.onDestroy(context: GameContext)
game.onCleanup(context: GameContext)

### Reactive properties API

game.setInitialGlobals(globals: GameGlobals)
game.setGlobal(key: string, value: any)
game.getGlobal(key)
game.getIntialGlobal(key: string)
game.getIntialGlobals(keys: string[])
game.onGlobalChange(key, (value: any, context: GameContext) => {})
game.onGlobalChanges(keys: string[], (values: Record<string, any>, context: GameContext) => {})

### Events API

game.dispatch(event: GameEvent, payload: GameEventPayload): Promise;
game.listen(event: GameEvent, (payload: GameEventPayload) => {});

# Stage API

```typescript
export declare function createStage(...options: StageOptions): Stage;
```

## Stage Instance API

stage.add(Camera | Entity | Configuration)
stage.remove(Camera | Entity | Configuration)
stage.setConfiguration(config: StageConfiguration)

### Managed API

stage.load((payload: StagePayload) => {})
stage.unload((payload: StagePayload) => {})

### Lifecycle API

stage.onSetup(context: StageContext)
stage.onLoaded(context: StageContext)
stage.onUpdate(context: StageContext)
stage.onDestroy(context: StageContext)
stage.onCleanup(context: StageContext)

### Reactive properties API

stage.setInitialVariables(variables: Record<string, any>)
stage.setVariable(key: string, value: any)
stage.getVariable(key)
stage.getIntialVariable(key: string)
stage.getIntialVariables(keys: string[])
stage.onVariableChange(key, (value: any, context: StageContext) => {})
stage.onVariableChanges(keys: string[], (values: Record<string, any>, context: StageContext) => {})

### Events API

stage.dispatch(event: StageEvent, payload: StageEventPayload): Promise;
stage.listen(event: StageEvent, (payload: StageEventPayload) => {});

# Camera API

TODO - fill in details about camera API

```typescript
export declare function createCamera(...options: CameraOptions): CameraWrapper;
```

## Camera Instance API

camera.addEffect(key: string, postProcessingPass: Pass) [addEffect example](https://jsfiddle.net/ko1vteua/)
camera.updateEffect(key: string, options: PassOptions)
camera.removeEffect(key: string)

camera.addBehavior(key: string, behavior: CameraBehavior) [i.e. followPlatformer or scroller]
camera.removeBehavior(key: string)
camera.addAction(cameraAction: CameraAction) [i.e. screenshake, temporary things]
camera.addWaypoints(...waypoints: CameraWaypoints) [waypoints example](https://jsfiddle.net/dLsg5o8u/)
