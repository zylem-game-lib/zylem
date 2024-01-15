# Zylem

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

## Repository Governance

### Conventional commits

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (example scopes: vite, npm, typescript, etc)

## Directory structure

### Tentative structuring

```
├── src
│  ├── lib
│  │  ├── behaviors
│  │  │  ├── Composable.ts
│  │  │  ├── Interactive.ts
│  │  │  └── Moveable.ts
│  │  ├── collision
│  │  │  ├── Collision.ts
│  │  │  └── ZylemWorld.ts
│  │  ├── core
│  │  │  ├── ZylemDebug.ts
│  │  │  ├── ZylemGame.ts
│  │  │  └── ZylemStage.ts
│  │  ├── device
│  │  │  ├── desktop.ts
│  │  │  ├── mobile.ts
│  │  │  └── tablet.ts
│  │  ├── entities
│  │  │  ├── Box.ts
│  │  │  ├── Sphere.ts
│  │  │  ├── Sprite.ts
│  │  │  ├── Zone.ts
│  │  │  └── index.ts
│  │  ├── input
│  │  │  └── ZylemGamePad.ts
│  │  ├── interfaces
│  │  │  ├── Entity.ts
│  │  │  ├── Game.ts
│  │  │  ├── GamePad.ts
│  │  │  ├── Perspective.ts
│  │  │  ├── Update.ts
│  │  │  └── Utility.ts
│  │  ├── rendering
│  │  │  ├── RenderPass.ts
│  │  │  ├── ZylemCamera.ts
│  │  │  ├── ZylemScene.ts
│  │  │  └── shaders
│  │  │      ├── fragment
│  │  │      │  ├── pixelated.fx
│  │  │      │  └── standard.fx
│  │  │      └── vertex
│  │  │          └── standard.fx
│  │  ├── state
│  │  │  ├── GameState.ts
│  │  │  ├── StageState.ts
│  │  │  └── index.ts
│  │  └── ui
│  │      └── ZylemHUD.ts
│  ├── main.ts
│  └── tests
```
