//! Platformer 3D step routine.
//!
//! Runs each tick over every kinematic capsule slot in `Gameplay3DState`:
//! 1. Compute horizontal velocity from input (walk/run).
//! 2. Run the jump FSM (buffering, coyote time, multi-jump rules, jump-cut
//!    ramp). Logic is ported one-for-one from the TS behavior in
//!    `packages/game-lib/src/lib/behaviors/platformer-3d/platformer-3d.behavior.ts`.
//! 3. Apply gravity to `linvel.y` while airborne.
//! 4. Hand `linvel * dt` to `KinematicCharacterController::move_shape` to get
//!    the corrected translation + grounded flag.
//! 5. Apply translation to slot position and update grounded/jump state,
//!    emitting `JumpStarted` / `Landed` runtime events on edges.

use rapier3d::math::{Pose, Vec3};
use rapier3d::prelude::*;

use crate::runtime::behaviors::platformer_3d::components::{
    Platformer3DConfig, Platformer3DInput, Platformer3DState, JUMP_CUT_RAMP_DURATION,
};
use crate::runtime::behaviors::platformer_3d::fsm::update_fsm;
use crate::runtime::components::body_3d::{Body3DKind, Body3DSlot};
use crate::runtime::events::RuntimeEventType;
use crate::runtime::modes::gameplay_3d::Gameplay3DState;

/// Lifted from the TS implementation: only allow jump-cut after the jump has
/// been in flight for at least this long (prevents cutting a multi-jump in
/// the same frame it starts).
const MIN_TIME_BEFORE_JUMP_CUT: f32 = 0.1;

pub fn step_platformer_bodies(state: &mut Gameplay3DState, dt: f32) {
    let dt = dt.max(0.0);
    let count = state.slots.len();

    for index in 0..count {
        if state.slots[index].kind != Body3DKind::KinematicCapsule {
            continue;
        }

        // Phase 1+2+3: input -> velocity, jump FSM, gravity. Operates only
        // on `slot.linvel` and `state.states[index]`.
        let jump_started = update_velocity_and_jump(
            &mut state.slots[index],
            &mut state.states[index],
            &state.inputs[index],
            &state.configs[index],
            dt,
        );

        // Phase 4: KCC sweep. Borrows broad_phase/narrow_phase/bodies/colliders
        // immutably + slot pose immutably; produces an owned
        // `EffectiveCharacterMovement`.
        let half_height = state.slots[index].half_height;
        let radius = state.slots[index].radius;
        let position = state.slots[index].position;
        let linvel = state.slots[index].linvel;
        let desired_translation = Vec3::new(linvel[0] * dt, linvel[1] * dt, linvel[2] * dt);
        let character_shape = Capsule::new_y(half_height, radius);
        let pose = Pose::translation(position[0], position[1], position[2]);

        let effective = {
            let query_pipeline = state.broad_phase.as_query_pipeline(
                state.narrow_phase.query_dispatcher(),
                &state.bodies,
                &state.colliders,
                QueryFilter::default(),
            );
            state.controller.move_shape(
                dt,
                &query_pipeline,
                &character_shape,
                &pose,
                desired_translation,
                |_| {},
            )
        };

        // Phase 5: write back. Mutably touches slot/state.
        let was_grounded = state.states[index].grounded;
        let was_falling = state.states[index].falling;
        {
            let slot = &mut state.slots[index];
            slot.position[0] += effective.translation.x;
            slot.position[1] += effective.translation.y;
            slot.position[2] += effective.translation.z;
            slot.grounded = effective.grounded;

            // KCC may zero vertical motion when grounded; reflect that back
            // into linvel so the next frame's gravity integration starts
            // from rest rather than continuing to accumulate downward speed.
            if effective.grounded && slot.linvel[1] < 0.0 {
                slot.linvel[1] = 0.0;
            }
        }

        update_grounded_state(
            &state.slots[index],
            &mut state.states[index],
            dt,
        );

        // Animation FSM tick. Runs after physics state has settled so
        // `state.grounded/jumping/falling` reflect this frame's reality.
        update_fsm(
            &mut state.fsm_states[index],
            &state.states[index],
            &state.inputs[index],
            jump_started,
        );

        // Edge events.
        if jump_started {
            let jump_count = state.states[index].jump_count as usize;
            state.push_event(RuntimeEventType::JumpStarted, index, jump_count, 0);
        }
        let is_grounded_now = state.states[index].grounded;
        let landed = !was_grounded && is_grounded_now && was_falling;
        if landed {
            state.push_event(RuntimeEventType::Landed, index, 0, 0);
        }
    }
}

/// Applies horizontal velocity from input, runs the jump FSM, and integrates
/// gravity into `linvel.y` while airborne. Returns `true` if a jump impulse
/// was applied this frame (used to emit `JumpStarted` after the KCC sweep).
///
/// Mirrors the order in the TS behavior: walk speed → jump (buffer + cut
/// ramp + execute) → gravity, with the same `jumped_this_frame` flag used to
/// suppress gravity exactly once after a jump impulse.
fn update_velocity_and_jump(
    slot: &mut Body3DSlot,
    s: &mut Platformer3DState,
    input: &Platformer3DInput,
    config: &Platformer3DConfig,
    dt: f32,
) -> bool {
    let speed = if input.run { config.run_speed } else { config.walk_speed };
    s.current_speed = speed;
    slot.linvel[0] = input.move_x.clamp(-1.0, 1.0) * speed;
    slot.linvel[2] = input.move_z.clamp(-1.0, 1.0) * speed;

    if s.jumping || s.falling {
        s.time_since_jump += dt;
    }

    if !input.jump && s.jump_held {
        s.jump_released_since_last_jump = true;
    }

    if input.jump && !s.jump_pressed_last_frame {
        s.jump_buffered = true;
        s.jump_buffer_timer = config.jump_buffer_time;
    }

    s.jump_pressed_last_frame = input.jump;
    s.jump_held = input.jump;

    if s.jump_buffered {
        s.jump_buffer_timer -= dt;
        if s.jump_buffer_timer <= 0.0 {
            s.jump_buffered = false;
        }
    }

    let can_apply_cut = s.time_since_jump >= MIN_TIME_BEFORE_JUMP_CUT;
    if !input.jump && s.jumping && !s.jump_cut_applied && can_apply_cut {
        s.jump_cut_applied = true;
        s.jump_cut_ramp_timer = JUMP_CUT_RAMP_DURATION;
    }

    if s.jump_cut_ramp_timer > 0.0 {
        let vy = slot.linvel[1];
        if vy > 0.0 {
            let step_t = (dt / s.jump_cut_ramp_timer).min(1.0);
            let target_y = vy * config.jump_cut_multiplier;
            slot.linvel[1] = vy + (target_y - vy) * step_t;
        }
        s.jump_cut_ramp_timer = (s.jump_cut_ramp_timer - dt).max(0.0);
    }

    let mut jump_started = false;
    if s.jump_buffered {
        let in_coyote_window = !s.grounded && s.time_since_grounded <= config.coyote_time;
        let is_first_jump = s.grounded || (in_coyote_window && s.jump_count == 0);

        let has_jumps_remaining = s.jump_count < config.max_jumps;
        let button_released = s.jump_released_since_last_jump;
        let in_multi_jump_window = s.time_since_jump >= config.multi_jump_window;
        let can_multi_jump = !s.grounded
            && has_jumps_remaining
            && button_released
            && in_multi_jump_window;

        if is_first_jump || can_multi_jump {
            s.jump_buffered = false;
            s.jump_count += 1;
            s.jump_released_since_last_jump = false;
            s.time_since_jump = 0.0;
            s.jumping = true;
            s.falling = false;
            s.jump_cut_applied = false;
            s.jump_cut_ramp_timer = 0.0;
            s.jumped_this_frame = true;
            jump_started = true;
            slot.linvel[1] = config.jump_force;
        }
    }

    // Gravity is *always* integrated into `linvel.y` (except on the exact
    // frame a jump impulse is written) so the desired translation handed
    // to the KCC always has a downward component. This is the pattern
    // recommended in the Rapier book for kinematic character controllers:
    //
    //   > "Always apply gravity to the desired translation. Otherwise the
    //   >  character will not be able to follow a slope going downward."
    //
    // Without this, walking horizontally on a downhill slope produced a
    // visible "stair-step" airborne pattern: linvel.y stayed at 0 while
    // grounded → desired_translation.y = 0 → KCC moved purely horizontal
    // → next-tick surface was below the capsule by more than the offset
    // → KCC reported airborne → snap_to_ground sometimes failed → free
    // fall for several frames before re-landing. The post-step clamp in
    // `step_platformer_bodies` (sets `linvel.y = 0` when grounded after
    // KCC reports it) prevents downward velocity from accumulating across
    // grounded frames, so this stays bounded at -gravity*dt while resting.
    if s.jumped_this_frame {
        s.jumped_this_frame = false;
    } else {
        slot.linvel[1] -= config.gravity * dt;
    }

    jump_started
}

/// Updates grounded/jump bookkeeping after KCC has reported the new state.
/// Tracks `time_since_grounded` for coyote time, resets `jump_count` on
/// landing, and flips jumping/falling based on vertical velocity.
fn update_grounded_state(slot: &Body3DSlot, s: &mut Platformer3DState, dt: f32) {
    let was_grounded = s.grounded;
    s.grounded = slot.grounded;

    if s.grounded {
        s.time_since_grounded = 0.0;
        s.last_grounded_y = slot.position[1];
    } else {
        s.time_since_grounded += dt;
    }

    if !was_grounded && s.grounded {
        s.jump_count = 0;
        s.jumping = false;
        s.falling = false;
        s.jump_cut_applied = false;
        s.jump_cut_ramp_timer = 0.0;
    }

    let vy = slot.linvel[1];
    if vy < -0.1 && !s.grounded {
        if s.jumping && vy < 0.0 {
            s.jumping = false;
            s.falling = true;
        } else if !s.jumping {
            s.falling = true;
        }
    }
}

#[cfg(test)]
mod tests {
    //! Pure FSM tests for `update_velocity_and_jump`. Drive the function
    //! directly with a fabricated `Body3DSlot` + `Platformer3DState` so we
    //! can verify jump buffering, coyote timing, multi-jump rules, and the
    //! jump-cut ramp without spinning up Rapier or KCC.

    use super::*;
    use crate::runtime::behaviors::platformer_3d::components::Platformer3DConfig;
    use crate::runtime::components::body_3d::Body3DSlot;

    const DT: f32 = 1.0 / 60.0;

    fn fresh_slot() -> Body3DSlot {
        Body3DSlot::capsule_kinematic([0.0, 1.0, 0.0], 0.5, 0.3)
    }

    fn ground_state() -> Platformer3DState {
        let mut state = Platformer3DState::default();
        state.grounded = true;
        state
    }

    #[test]
    fn jump_from_ground_sets_velocity_and_increments_count() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();
        let input = Platformer3DInput {
            jump: true,
            ..Default::default()
        };

        let started = update_velocity_and_jump(&mut slot, &mut state, &input, &cfg, DT);

        assert!(started, "jump should fire from grounded state");
        assert!(state.jumping);
        assert_eq!(state.jump_count, 1);
        assert!((slot.linvel[1] - cfg.jump_force).abs() < 1e-4);
        assert!(state.jumped_this_frame == false, "jumped_this_frame consumed inside same call");
    }

    #[test]
    fn multi_jump_requires_button_release() {
        let mut cfg = Platformer3DConfig::default();
        cfg.max_jumps = 2;
        let mut slot = fresh_slot();
        let mut state = ground_state();
        let press = Platformer3DInput {
            jump: true,
            ..Default::default()
        };

        update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        assert_eq!(state.jump_count, 1);

        state.grounded = false;
        slot.grounded = false;
        let elapsed_ticks = ((cfg.multi_jump_window / DT).ceil() as i32) + 2;
        for _ in 0..elapsed_ticks {
            update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        }
        assert_eq!(
            state.jump_count, 1,
            "holding jump must not consume a second jump"
        );

        let release = Platformer3DInput::default();
        update_velocity_and_jump(&mut slot, &mut state, &release, &cfg, DT);
        update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        assert_eq!(
            state.jump_count, 2,
            "release+repress within window should fire second jump"
        );
    }

    /// Jump-buffer test. Sets up a state where the player has used their
    /// only jump (mid-air, past coyote), presses jump, then "lands" within
    /// the buffer window. The buffered jump must fire as soon as grounded.
    #[test]
    fn jump_buffer_fires_on_landing_within_window() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();

        let press = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        assert_eq!(state.jump_count, 1);

        state.grounded = false;
        slot.grounded = false;
        state.time_since_grounded = cfg.coyote_time + 0.5;

        let release = Platformer3DInput::default();
        update_velocity_and_jump(&mut slot, &mut state, &release, &cfg, DT);

        let press_again = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &press_again, &cfg, DT);
        assert!(state.jump_buffered, "press while ineligible should buffer");
        assert_eq!(state.jump_count, 1, "no extra jump fires while airborne");

        state.grounded = true;
        slot.grounded = true;
        state.time_since_grounded = 0.0;
        state.jump_count = 0;

        let hold = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &hold, &cfg, DT);
        assert_eq!(
            state.jump_count, 1,
            "buffered press should consume on landing within window"
        );
    }

    #[test]
    fn jump_cut_reduces_upward_velocity_after_min_window() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();
        let press = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        assert!(state.jumping);

        state.grounded = false;
        slot.grounded = false;

        let min_ticks = ((MIN_TIME_BEFORE_JUMP_CUT / DT).ceil() as i32) + 1;
        let hold = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        for _ in 0..min_ticks {
            update_velocity_and_jump(&mut slot, &mut state, &hold, &cfg, DT);
        }

        let pre_cut_vy = slot.linvel[1];
        let release = Platformer3DInput::default();
        update_velocity_and_jump(&mut slot, &mut state, &release, &cfg, DT);

        assert!(state.jump_cut_applied);
        assert!(
            slot.linvel[1] < pre_cut_vy,
            "vy must drop after jump cut: before={} after={}",
            pre_cut_vy,
            slot.linvel[1]
        );
    }

    #[test]
    fn coyote_window_lets_first_jump_fire_after_leaving_ground() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();

        let idle = Platformer3DInput::default();
        update_velocity_and_jump(&mut slot, &mut state, &idle, &cfg, DT);

        state.grounded = false;
        slot.grounded = false;
        state.time_since_grounded = cfg.coyote_time * 0.5;

        let press = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        let started = update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        assert!(started, "coyote-time press should trigger first jump");
        assert_eq!(state.jump_count, 1);
        assert!((slot.linvel[1] - cfg.jump_force).abs() < 1e-4);
    }

    #[test]
    fn coyote_window_expires() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();

        let idle = Platformer3DInput::default();
        update_velocity_and_jump(&mut slot, &mut state, &idle, &cfg, DT);

        state.grounded = false;
        slot.grounded = false;
        state.time_since_grounded = cfg.coyote_time * 1.5;

        let press = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        let started = update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        assert!(
            !started,
            "outside coyote window without remaining jumps, no jump should fire"
        );
        assert_eq!(state.jump_count, 0);
    }

    #[test]
    fn run_input_uses_run_speed() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();
        let walk = Platformer3DInput {
            move_x: 1.0,
            run: false,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &walk, &cfg, DT);
        assert!((slot.linvel[0] - cfg.walk_speed).abs() < 1e-4);

        let run = Platformer3DInput {
            move_x: 1.0,
            run: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &run, &cfg, DT);
        assert!((slot.linvel[0] - cfg.run_speed).abs() < 1e-4);
    }

    #[test]
    fn gravity_skipped_on_jump_frame_then_applied() {
        let cfg = Platformer3DConfig::default();
        let mut slot = fresh_slot();
        let mut state = ground_state();

        let press = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &press, &cfg, DT);
        let after_jump_vy = slot.linvel[1];
        assert!((after_jump_vy - cfg.jump_force).abs() < 1e-4);

        state.grounded = false;
        slot.grounded = false;
        let hold = Platformer3DInput {
            jump: true,
            ..Default::default()
        };
        update_velocity_and_jump(&mut slot, &mut state, &hold, &cfg, DT);
        assert!(
            slot.linvel[1] < after_jump_vy,
            "gravity should reduce vy on subsequent frames"
        );
    }
}
