# Zylem

- create(options: GameOptions)

Create a new game instance.

- configure(options: ConfigurationOptions)

Global configuration.

## GameOptions

See Game properties

## Game

- id: string
- globals: Object
- stages(): Stage[]
- start()
- pause()
- reset()

## Stage (Interface StageOptions)

- perspective: Perspective
- backgroundColor: Color
- backgroundImage: string
- children(globals): Entity[]
- reset()
- change()

## Entity

- create(options: EntityOptions)
- group: Group
- setup(options: SetupOptions)
- update(options: UpdateOptions)
- collision(options: CollisionOptions)
- name: string
- spawn(T)
- spawnRelative(T)
- destroy()

### Entity Types

- Box
- Sphere
- Plane
- Sprite
  - images: Image[]
  - animations: Animation[]
  - sheets: Sheet[]
- Text
- Level
- Model
- Actor
- Camera
- Light

### Entity Modifiers

- Trigger
  - Entered
  - Held => Time
  - Exit
- Physics (NMI)
- Shader

### Ideas

#### Sprite Animation
