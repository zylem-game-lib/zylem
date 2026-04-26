//! Animation-facing FSM for the 3D platformer.
//!
//! Mirrors the TypeScript `Platformer3DFSM` in
//! `packages/game-lib/src/lib/behaviors/platformer-3d/platformer-3d-fsm.ts` so
//! TS hosts can drive animations from the same state names whether the
//! simulation runs in TS or in this wasm runtime.
//!
//! The FSM is intentionally separate from the jump/coyote state in
//! [`Platformer3DState`]: that struct already tracks the *physics* state
//! machine (jumping/falling/grounded/etc.); this module wraps a small,
//! animation-friendly enum on top of it (idle/walking/running/jumping/
//! falling/landing) with the exact same transition rules as the TS impl.

use crate::runtime::behaviors::platformer_3d::components::{
    Platformer3DInput, Platformer3DState,
};

/// Animation-facing platformer state. The discriminants are `#[repr(u32)]`
/// so they can be returned through the C ABI without further mapping.
///
/// Stable values — these are part of the wasm ABI and the TS bindings rely
/// on them. Append new states; never reorder.
#[repr(u32)]
#[derive(Clone, Copy, Debug, Eq, PartialEq, Default)]
pub enum Platformer3DFsmState {
    #[default]
    Idle = 0,
    Walking = 1,
    Running = 2,
    Jumping = 3,
    Falling = 4,
    Landing = 5,
}

/// Tunables for the FSM. Lifted from the TS implementation: a horizontal
/// input with magnitude below this is considered "no movement" for the
/// idle/walking/running decision.
const HORIZONTAL_INPUT_DEADZONE: f32 = 0.1;

/// Updates the animation FSM for a single platformer slot.
///
/// Call once per tick **after** [`super::system::step_platformer_bodies`] has
/// updated `state.grounded` / `state.jumping` / `state.falling`. `jump_started`
/// is the per-tick edge from the velocity step (see
/// [`super::system::step_platformer_bodies`]) — true on the frame a jump
/// impulse is applied — and is the FSM equivalent of the TS impl's `input.jump
/// && !state.jumpPressedLastFrame` edge. Returns the new FSM state.
pub fn update_fsm(
    fsm: &mut Platformer3DFsmState,
    state: &Platformer3DState,
    input: &Platformer3DInput,
    jump_started: bool,
) -> Platformer3DFsmState {
    let has_input = input.move_x.abs() > HORIZONTAL_INPUT_DEADZONE
        || input.move_z.abs() > HORIZONTAL_INPUT_DEADZONE;
    let is_running = input.run;

    let was_falling = matches!(fsm, Platformer3DFsmState::Falling);
    if was_falling && state.grounded {
        try_transition(fsm, Platformer3DFsmState::Landing);
    }

    if state.grounded {
        if has_input {
            if is_running {
                try_transition(fsm, Platformer3DFsmState::Running);
            } else {
                try_transition(fsm, Platformer3DFsmState::Walking);
            }
        } else {
            try_transition(fsm, Platformer3DFsmState::Idle);
        }
    } else if state.falling {
        try_transition(fsm, Platformer3DFsmState::Falling);
    } else if state.jumping {
        try_transition(fsm, Platformer3DFsmState::Jumping);
    }

    if jump_started {
        try_transition(fsm, Platformer3DFsmState::Jumping);
    }

    *fsm
}

/// Transition table mirroring the TS `t(...)` list. Returns true if the
/// transition is allowed from the current state.
fn allowed(from: Platformer3DFsmState, to: Platformer3DFsmState) -> bool {
    use Platformer3DFsmState::*;

    if from == to {
        // Self-transitions are no-ops (re-entering the same state must not
        // restart animations — the TS impl uses `machine.can(event)` which
        // also returns true for self-edges in the table; we just ignore
        // them for animation purposes).
        return false;
    }

    match (from, to) {
        (Idle, Walking | Running | Jumping | Falling) => true,
        (Walking, Running | Jumping | Idle | Falling) => true,
        (Running, Walking | Jumping | Idle | Falling) => true,
        (Jumping, Falling | Landing | Jumping) => true,
        (Falling, Landing) => true,
        (Landing, Walking | Running | Idle) => true,
        _ => false,
    }
}

fn try_transition(fsm: &mut Platformer3DFsmState, to: Platformer3DFsmState) {
    if allowed(*fsm, to) {
        *fsm = to;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::runtime::behaviors::platformer_3d::components::Platformer3DState;

    fn grounded_state() -> Platformer3DState {
        let mut state = Platformer3DState::default();
        state.grounded = true;
        state
    }

    fn input(move_x: f32, jump: bool, run: bool) -> Platformer3DInput {
        Platformer3DInput {
            move_x,
            move_z: 0.0,
            jump,
            run,
        }
    }

    #[test]
    fn idle_with_no_input_stays_idle() {
        let mut fsm = Platformer3DFsmState::default();
        update_fsm(
            &mut fsm,
            &grounded_state(),
            &Platformer3DInput::default(),
            false,
        );
        assert_eq!(fsm, Platformer3DFsmState::Idle);
    }

    #[test]
    fn walk_input_transitions_to_walking() {
        let mut fsm = Platformer3DFsmState::default();
        update_fsm(&mut fsm, &grounded_state(), &input(1.0, false, false), false);
        assert_eq!(fsm, Platformer3DFsmState::Walking);
    }

    #[test]
    fn run_flag_transitions_walking_to_running() {
        let mut fsm = Platformer3DFsmState::Walking;
        update_fsm(&mut fsm, &grounded_state(), &input(1.0, false, true), false);
        assert_eq!(fsm, Platformer3DFsmState::Running);
    }

    #[test]
    fn release_input_returns_to_idle() {
        let mut fsm = Platformer3DFsmState::Running;
        update_fsm(
            &mut fsm,
            &grounded_state(),
            &Platformer3DInput::default(),
            false,
        );
        assert_eq!(fsm, Platformer3DFsmState::Idle);
    }

    #[test]
    fn jump_started_edge_transitions_to_jumping() {
        let mut fsm = Platformer3DFsmState::Idle;
        let mut state = grounded_state();
        state.jumping = true;
        state.grounded = false;
        update_fsm(&mut fsm, &state, &input(0.0, true, false), true);
        assert_eq!(fsm, Platformer3DFsmState::Jumping);
    }

    #[test]
    fn falling_state_takes_jumping_to_falling() {
        let mut fsm = Platformer3DFsmState::Jumping;
        let mut state = Platformer3DState::default();
        state.grounded = false;
        state.falling = true;
        update_fsm(&mut fsm, &state, &Platformer3DInput::default(), false);
        assert_eq!(fsm, Platformer3DFsmState::Falling);
    }

    #[test]
    fn falling_to_grounded_routes_through_landing() {
        let mut fsm = Platformer3DFsmState::Falling;
        let state = grounded_state();
        update_fsm(&mut fsm, &state, &Platformer3DInput::default(), false);
        assert_eq!(
            fsm,
            Platformer3DFsmState::Idle,
            "Landing should immediately transition to Idle when no input is held"
        );
    }

    /// When falling and grounded with movement input, the FSM should pass
    /// through Landing on its way to Walking/Running. The TS impl allows the
    /// landing transition followed immediately by the walk/run dispatch in
    /// the same `update()` call. We mirror that.
    #[test]
    fn falling_grounded_with_input_lands_then_walks() {
        let mut fsm = Platformer3DFsmState::Falling;
        let state = grounded_state();
        update_fsm(&mut fsm, &state, &input(1.0, false, false), false);
        assert_eq!(fsm, Platformer3DFsmState::Walking);
    }

    #[test]
    fn ledge_walk_off_transitions_walking_to_falling() {
        let mut fsm = Platformer3DFsmState::Walking;
        let mut state = Platformer3DState::default();
        state.grounded = false;
        state.falling = true;
        update_fsm(&mut fsm, &state, &input(1.0, false, false), false);
        assert_eq!(fsm, Platformer3DFsmState::Falling);
    }

    /// Holding jump (no edge) while already in `Jumping` must stay there;
    /// only a `jump_started=true` re-edge can re-enter Jumping.
    #[test]
    fn jump_held_with_no_edge_stays_in_jumping() {
        let mut fsm = Platformer3DFsmState::Jumping;
        let mut state = Platformer3DState::default();
        state.grounded = false;
        state.jumping = true;
        update_fsm(&mut fsm, &state, &input(0.0, true, false), false);
        assert_eq!(fsm, Platformer3DFsmState::Jumping);
    }
}
