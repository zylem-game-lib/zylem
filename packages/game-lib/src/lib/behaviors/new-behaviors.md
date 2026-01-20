# Overview

The new behaviors are ECS systems that integrate directly with the physics and collision world.

Refer to behavior-system.ts for the base behavior system class.

Each new behavior must include:

- a behavior implementation,
- an accompanying descriptor file, and
- a finite state machine (FSM) representation.

The FSM is used to report the behavior’s current state back to the consumer and to model discrete modes of operation.

Behaviors compute results, they do not apply them.
The consumer (engine / gameplay layer / physics adapter) decides how to use the result.
