---
title: Public API
description: Public entrypoints and re-export structure
sidebar_position: 2
---

Published imports are **subpath exports** (`@zylem/game-lib/core`, `/entity`, `/bridge`, …). Each `src/api/*.ts` file is a thin barrel that re-exports from `src/lib`; dependency flow is one-way **api → lib**. Prefer focused subpaths over pulling unrelated modules; behavior entrypoints map one file per import path under `@zylem/game-lib/behavior`.

```mermaid
flowchart LR
  subgraph exports["Published package exports"]
    pkg_core["@zylem/game-lib/core"]
    pkg_entity["@zylem/game-lib/entity"]
    pkg_actions["@zylem/game-lib/actions"]
    pkg_behavior["@zylem/game-lib/behavior"]
    pkg_input["@zylem/game-lib/input"]
    pkg_graphics["@zylem/game-lib/graphics"]
    pkg_audio["@zylem/game-lib/audio"]
    pkg_events["@zylem/game-lib/events"]
    pkg_bridge["@zylem/game-lib/bridge"]
    pkg_cinematics["@zylem/game-lib/cinematics"]
    pkg_wc["@zylem/game-lib/web-components"]
    pkg_catalog["@zylem/game-lib/catalog"]
    pkg_debug["@zylem/game-lib/debug"]
    pkg_globals["@zylem/game-lib/globals"]
    pkg_runtime["@zylem/game-lib/runtime"]
    pkg_schema["@zylem/game-lib/schema"]
  end

  subgraph api["src/api barrels"]
    api_core["core.ts"]
    api_entity["entity.ts"]
    api_actions["actions.ts"]
    api_behavior["behavior.ts"]
    api_input["input.ts"]
    api_graphics["graphics.ts"]
    api_audio["audio.ts"]
    api_events["events.ts"]
    api_bridge["bridge.ts"]
    api_cinematics["cinematics.ts"]
    api_wc["web-components.ts"]
    api_catalog["catalog.ts"]
    api_debug["debug.ts"]
    api_globals["globals.ts"]
    api_runtime["runtime.ts"]
    api_schema["schema.ts"]
  end

  subgraph lib["src/lib implementation"]
    lib_game["game/"]
    lib_stage["stage/"]
    lib_core["core/"]
    lib_entities["entities/"]
    lib_actions["actions/"]
    lib_camera["camera/"]
    lib_behaviors["behaviors/"]
    lib_input["input/"]
    lib_events["events/"]
    lib_graphics["graphics/"]
    lib_collision["collision/"]
    lib_bridge["bridge/"]
    lib_cinematics["cinematics/"]
    lib_audio["audio/ + sounds/"]
    lib_debug["debug/"]
  end

  pkg_core --> api_core
  pkg_entity --> api_entity
  pkg_actions --> api_actions
  pkg_behavior --> api_behavior
  pkg_input --> api_input
  pkg_graphics --> api_graphics
  pkg_audio --> api_audio
  pkg_events --> api_events
  pkg_bridge --> api_bridge
  pkg_cinematics --> api_cinematics
  pkg_wc --> api_wc
  pkg_catalog --> api_catalog
  pkg_debug --> api_debug
  pkg_globals --> api_globals
  pkg_runtime --> api_runtime
  pkg_schema --> api_schema

  api_core --> lib_game
  api_core --> lib_stage
  api_core --> lib_core
  api_core --> lib_camera
  api_core --> lib_actions
  api_entity --> lib_entities
  api_actions --> lib_actions
  api_behavior --> lib_behaviors
  api_input --> lib_input
  api_graphics --> lib_graphics
  api_audio --> lib_audio
  api_events --> lib_events
  api_bridge --> lib_bridge
  api_cinematics --> lib_cinematics
  api_wc --> lib_game
  api_catalog --> lib_entities
  api_debug --> lib_debug

  lib_game -.-> lib_stage
  lib_stage -.-> lib_entities
  lib_stage -.-> lib_camera
  lib_stage -.-> lib_behaviors
  lib_stage -.-> lib_collision
  lib_stage -.-> lib_events
  lib_camera -.-> lib_graphics
  lib_entities -.-> lib_actions
  lib_entities -.-> lib_behaviors
  lib_game -.-> lib_bridge
  lib_game -.-> lib_cinematics
```
