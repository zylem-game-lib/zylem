---
title: Audio
description: Procedural sound helpers vs loaded assets
sidebar_position: 15
---

The `src/lib/sounds` helpers (**pingPongBeep**, **ricochetSound**) synthesize short effects through the Web Audio API without touching **AssetManager**. Loaded music and samples use the separate `src/lib/audio` pipeline and asset loaders; the diagram below covers the procedural path only.

```mermaid
flowchart LR
  subgraph sounds["src/lib/sounds"]
    Ping["pingPongBeep(...)"]
    Ricochet["ricochetSound(...)"]
    Sfx["Procedural SFX routine"]
    Params["Sound parameters"]
  end

  subgraph callSites["Typical call sites"]
    Lifecycle["Game / Stage callbacks"]
    Gameplay["Entity / behavior logic"]
  end

  subgraph webaudio["Browser Web Audio API"]
    AudioContext
    Oscillator["OscillatorNode"]
    Gain["GainNode"]
    Destination["AudioDestinationNode"]
  end

  subgraph separate["Separate subsystem"]
    AssetManager["AssetManager loaders"]
    AssetPipeline["Loaded audio playback"]
  end

  Lifecycle --> Ping
  Gameplay --> Ping
  Lifecycle --> Ricochet
  Gameplay --> Ricochet
  Ping --> Params
  Ricochet --> Params
  Ping --> Sfx
  Ricochet --> Sfx
  Sfx --> AudioContext
  Sfx --> Oscillator
  Sfx --> Gain
  Oscillator --> Gain
  Gain --> Destination
  AudioContext --> Destination
  AssetManager --> AssetPipeline
```
