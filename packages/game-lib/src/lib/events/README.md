# events

The **events** subsystem provides a typed, in-process pub/sub bus used to decouple engine subsystems (stage, game, editor) from one another.

## Files

| File | Role |
|---|---|
| `event-emitter-delegate.ts` | `EventEmitterDelegate<TEvents>` — generic typed event emitter backed by a `Map` of listener arrays; used as a composition component inside `Game` and `Stage` |
| `zylem-events.ts` | Defines the canonical `zylemEventBus` singleton and the typed event maps (`GameEvents`, `StageEvents`, `EntityEvents`) |

## How it fits in

`Game` and `Stage` each hold an `EventEmitterDelegate` instance that supports `dispatch(eventName, payload)` and `on(eventName, handler)`. The shared `zylemEventBus` is used for cross-cutting events (e.g. stage transition, debug overlay toggle) that don't belong to a single game or stage instance.

The `@zylem/editor` package subscribes to stage / entity events to refresh its panels without being tightly coupled to game-lib internals.
