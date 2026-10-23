/** Source-backed captions, also used to generate navigation and accessible readouts. */
export interface ExhibitStop {
	title: string;
	label: string;
	detail: string;
	call: string;
	result: string;
	source: string;
}
export interface Exhibit {
	id: 'game' | 'config' | 'stage' | 'entity';
	name: string;
	title: string;
	intro: string;
	mechanism: string;
	note: string;
	stops: ExhibitStop[];
}
const source = (path: string) => `packages/game-lib/src/lib/${path}`;
export const EXHIBITS: Exhibit[] = [
	{
		id: 'game', name: 'Game', title: 'The stage switchboard',
		intro: 'One game holds the controls, the shared renderer, and the stage that is currently running. Slide the selector across the switchboard to inspect each responsibility.',
		mechanism: 'One selector. Five responsibilities.',
		note: 'These are responsibilities, not five steps repeated every frame. Stage changes tear down the outgoing stage before loading the next. The renderer manager is shared across stages.',
		stops: [
			{ title: 'Author', label: 'Game wrapper', detail: 'createGame stores the authored options and lifecycle callbacks. Calling start initializes globals, resolves the options, creates the runtime game and loads its first stage.', call: 'createGame(...options) → game.start()', result: 'Options become a running game', source: source('game/game.ts') },
			{ title: 'Input', label: 'InputManager', detail: 'The game owns an InputManager. When a stage becomes active, its input configuration is merged over the game-wide input configuration. Runtime changes can reconfigure the same manager.', call: 'mergeInputConfigs(globalInputConfig, stage.inputConfig)', result: 'Stage bindings override global bindings', source: source('game/zylem-game.ts') },
			{ title: 'Renderer', label: 'RendererManager', detail: 'The renderer manager is created lazily on the first stage load and reused for later stages. Each loaded stage wires its scene and cameras into the rendering path.', call: 'rendererManager → stage.load(...)', result: 'One shared renderer manager', source: source('game/zylem-game.ts') },
			{ title: 'Active stage', label: 'Stage lifetime', detail: 'A stage load is guarded against overlapping requests. The outgoing stage is destroyed and removed; the incoming stage loads, becomes current, receives input bindings, and runs setup. An optional transition can preserve the outgoing image.', call: 'loadStage() → unloadCurrentStage() → stage.load()', result: 'One current stage; previous resources released', source: source('game/zylem-game.ts') },
			{ title: 'Game loop', label: 'Update clock', detail: 'The game loop drives step: it gathers inputs and context, runs the game update callback, then updates the current stage. Rendering has its own callback. Inspect the frame press for the detailed update order.', call: 'loop() → step() → current stage update', result: 'Game update and drawing have separate callbacks', source: source('game/zylem-game.ts') },
		],
	},
	{
		id: 'config', name: 'Config', title: 'The defaults cabinet',
		intro: 'Configuration has separate scopes. Pull a drawer to inspect game display settings, device overrides, or stage options—and see the concrete values that come out.',
		mechanism: 'Four drawers. Explicit precedence.',
		note: 'The examples are deliberately small. Game display resolution, stage options, entity options, and input bindings have different resolvers; there is no universal deep-merge pipeline. gameConfig and stageConfig return plain authoring objects.',
		stops: [
			{ title: 'Game defaults', label: 'Desktop · no display options', detail: 'The game defaults to a 16:9 display aspect and fullscreen. Without a desktop resolution override, internalResolution stays undefined so the renderer uses the viewport. Container resolution happens separately.', call: 'resolveGameConfig({}, { deviceProfile: \'desktop\' })', result: 'Aspect 16:9 · internal buffer: viewport · fullscreen true', source: source('game/game-config.ts') },
			{ title: 'Desktop', label: 'Explicit display resolution', detail: 'An explicit width and height set the desktop render buffer. With no explicit aspect ratio or preset, their ratio supplies the display aspect. The example resolves to 1280 × 720 at 16:9.', call: 'gameConfig({ resolution: { width: 1280, height: 720 } })', result: 'Aspect 16:9 · internal buffer: 1280 × 720', source: source('game/game-config.ts') },
			{ title: 'Mobile', label: 'Device-specific resolution', detail: 'On mobile, a mobile resolution wins. When it is absent, the engine computes a buffer with a 360-pixel short edge from the resolved aspect. At 16:9 that is 640 × 360, even if the desktop buffer is 1280 × 720. mobile.resolution: \'native\' instead uses the viewport.', call: 'desktop 1280 × 720 + mobile profile + no mobile resolution', result: 'Aspect 16:9 · internal buffer: 640 × 360', source: source('game/game-config.ts') },
			{ title: 'Stage options', label: 'A separate config scope', detail: 'createStage separates config objects, camera wrappers, and entity inputs. Later config objects replace earlier top-level keys; missing values fall back to stage defaults. Gravity defaults to zero and physicsRate to 60 Hz. Nested objects such as variables are replaced, not deep-merged.', call: 'parseStageOptions([{ variables: { a: 1 } }, { variables: { b: 2 } }])', result: 'variables { b: 2 } · gravity (0, 0, 0) · physics 60 Hz', source: source('stage/stage-config.ts') },
		],
	},
	{
		id: 'stage', name: 'Stage', title: 'The scene workbench',
		intro: 'A stage brings scene, cameras, simulation, and entities together. Move the inspection carriage to see what each station owns and how its lifetime ends.',
		mechanism: 'A shared bench. Owned resources.',
		note: 'The stations explain ownership rather than a loading timeline. During loading, Zylem resolves cameras, constructs the scene and world, attaches delegates, and loads entities. The frame press shows what happens once the stage is running.',
		stops: [
			{ title: 'Cameras', label: 'Framing and views', detail: 'The stage camera delegate builds a camera manager from supplied cameras and resolves a primary camera. Multiple views share the renderer supplied by the game. Camera follow updates run after entity render poses synchronize.', call: 'cameraDelegate.buildCameraManager(...)', result: 'Stage cameras + shared game renderer', source: source('stage/zylem-stage.ts') },
			{ title: 'Scene', label: 'Visible world', detail: 'ZylemScene owns the Three.js scene and applies stage appearance. The renderer draws this scene through its cameras. Background, default lighting, and postprocessing come from stage configuration.', call: 'new ZylemScene(id, camera, state)', result: 'Scene contents and appearance', source: source('stage/zylem-stage.ts') },
			{ title: 'Simulation', label: 'Physics world', detail: 'The stage creates its world with resolved gravity and physicsRate. The world owns the simulation; behavior systems and entity callbacks write inputs before the world steps. Render poses are read afterward.', call: 'await ZylemWorld.create(gravity, physicsRate)', result: 'game-lib → behaviors → runtime', source: source('stage/zylem-stage.ts') },
			{ title: 'Entities', label: 'Loading and registration', detail: 'The entity delegate attaches to the scene, world, render strategy, and camera. It loads initial entities and queued asynchronous inputs, manages behavior systems, and handles later additions and removals.', call: 'entityDelegate.attach(...) → runEntityLoadGenerator()', result: 'Entities registered in their stage context', source: source('stage/zylem-stage.ts') },
			{ title: 'Cleanup', label: 'End of the stage lifetime', detail: 'Destroying a stage destroys its entities and behavior systems, world, and scene; disposes delegates and render strategies; stops the render loop; and clears stage variables. The game can then load another stage using its shared renderer manager.', call: 'destroyAll() → world.destroy() → scene.destroy()', result: 'Stage resources released; game remains', source: source('stage/zylem-stage.ts') },
		],
	},
	{
		id: 'entity', name: 'Entity', title: 'The entity assembly jig',
		intro: 'Choose a specimen to see what gets assembled and how it reaches a stage. Actors, sprites, shapes, text, and zones share the entity foundation; a Level feeds multiple catalog entries into it.',
		mechanism: 'Six specimens. Different construction paths.',
		note: 'The specimens are mechanical stand-ins, not rendered engine assets. GameEntity extends BaseNode with transforms, actions, collision support, and behavior descriptors attached through use(...). The stage supplies runtime registration. Level is a stream of entries, not a GameEntity subclass.',
		stops: [
			{ title: 'Actor', label: 'Model + animation', detail: 'An Actor loads model assets and animation clips. Its builder supplies the entity and collision definition; capsule is the default collision shape, with bounds and triangle-mesh alternatives. The stage handles model readiness and runtime registration.', call: 'createActor({ models: [...] })', result: 'Model-backed GameEntity', source: source('entities/actor.ts') },
			{ title: 'Sprite', label: 'Texture + frame selection', detail: 'A Sprite uses image entries or one spritesheet divided into named frames. Sheet animation moves the texture UV window. It builds Three.js sprites, animation state, and a box collision definition using collisionSize or size.', call: 'createSprite({ sheet: { file, columns, rows, frames } })', result: 'Texture-backed GameEntity', source: source('entities/sprite.ts') },
			{ title: 'Shapes', label: 'Geometry + collider', detail: 'Factories such as createBox and createSphere combine default options with authored options, then use mesh and collision builders. The same factory pattern covers pills, planes, cylinders, cones, and other primitives.', call: 'createBox(...) / createSphere(...) / createPill(...)', result: 'Procedural GameEntity', source: source('entities/create.ts') },
			{ title: 'Text', label: 'Text in the scene', detail: 'Text is a GameEntity with text-specific geometry and update behavior. It participates in the same lifecycle and can be positioned in the scene or use screen anchoring. Its content is authored through createText.', call: 'createText({ text: \'Score\' })', result: 'Text-backed GameEntity', source: source('entities/text.ts') },
			{ title: 'Zone', label: 'Sensor volume', detail: 'A Zone represents a sensor volume that detects overlap. It is useful for triggers rather than a visible solid obstacle. The editor can draw a selection proxy for its volume.', call: 'createZone({ size: { x: 4, y: 2, z: 4 } })', result: 'Sensor GameEntity', source: source('entities/zone.ts') },
			{ title: 'Level', label: 'Catalog entries → stage entities', detail: 'streamLevelOnStage walks a LevelBuffer in batches (five entries by default), resolves each typeId in the entity catalog, creates and spawns the entity, then applies its pose. Unknown catalog types are skipped. The returned spawned count measures entries handed off, including skipped types.', call: 'LevelBuffer → catalog.create → stage.spawnEntity → pose', result: 'Many entities from one level buffer', source: source('level/stream-level-stage.ts') },
		],
	},
];

export function stopIndex(index: number, count: number): number {
	return ((Math.trunc(index) % count) + count) % count;
}
