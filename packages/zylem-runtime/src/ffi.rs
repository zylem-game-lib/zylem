use crate::runtime::{RuntimeStats, RuntimeWorld, Vec3};

fn with_world<T>(
    world: *const RuntimeWorld,
    default: T,
    callback: impl FnOnce(&RuntimeWorld) -> T,
) -> T {
    if world.is_null() {
        return default;
    }

    // Safety: the caller owns the pointer contract for the exported ABI.
    let world = unsafe { &*world };
    callback(world)
}

fn with_world_mut<T>(
    world: *mut RuntimeWorld,
    default: T,
    callback: impl FnOnce(&mut RuntimeWorld) -> T,
) -> T {
    if world.is_null() {
        return default;
    }

    // Safety: the caller owns the pointer contract for the exported ABI.
    let world = unsafe { &mut *world };
    callback(world)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_world_new() -> *mut RuntimeWorld {
    Box::into_raw(Box::new(RuntimeWorld::new()))
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_free(world: *mut RuntimeWorld) {
    if world.is_null() {
        return;
    }

    // Safety: `world` originated from `Box::into_raw` in `zylem_runtime_world_new`.
    unsafe {
        drop(Box::from_raw(world));
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_spawn(world: *mut RuntimeWorld) -> u32 {
    with_world_mut(world, u32::MAX, RuntimeWorld::spawn)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_despawn(world: *mut RuntimeWorld, entity: u32) -> u8 {
    with_world_mut(world, 0, |world| u8::from(world.despawn(entity)))
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_step(world: *mut RuntimeWorld, delta_seconds: f32) {
    with_world_mut(world, (), |world| world.step(delta_seconds));
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_set_position(
    world: *mut RuntimeWorld,
    entity: u32,
    x: f32,
    y: f32,
    z: f32,
) -> u8 {
    with_world_mut(world, 0, |world| {
        u8::from(world.set_position(entity, Vec3::new(x, y, z)))
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_get_position(
    world: *const RuntimeWorld,
    entity: u32,
) -> Vec3 {
    with_world(world, Vec3::ZERO, |world| {
        world.position(entity).unwrap_or(Vec3::ZERO)
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_set_velocity(
    world: *mut RuntimeWorld,
    entity: u32,
    x: f32,
    y: f32,
    z: f32,
) -> u8 {
    with_world_mut(world, 0, |world| {
        u8::from(world.set_velocity(entity, Vec3::new(x, y, z)))
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_get_velocity(
    world: *const RuntimeWorld,
    entity: u32,
) -> Vec3 {
    with_world(world, Vec3::ZERO, |world| {
        world.velocity(entity).unwrap_or(Vec3::ZERO)
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_stats(world: *const RuntimeWorld) -> RuntimeStats {
    with_world(world, RuntimeStats::default(), RuntimeWorld::stats)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_live_entities(world: *const RuntimeWorld) -> u32 {
    with_world(world, 0, |world| world.stats().live_entities)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_allocated_entities(world: *const RuntimeWorld) -> u32 {
    with_world(world, 0, |world| world.stats().allocated_entities)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_tick_count(world: *const RuntimeWorld) -> u32 {
    with_world(world, 0, |world| world.stats().tick_count)
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_position_x(
    world: *const RuntimeWorld,
    entity: u32,
) -> f32 {
    with_world(world, 0.0, |world| {
        world.position(entity).unwrap_or(Vec3::ZERO).x
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_position_y(
    world: *const RuntimeWorld,
    entity: u32,
) -> f32 {
    with_world(world, 0.0, |world| {
        world.position(entity).unwrap_or(Vec3::ZERO).y
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_position_z(
    world: *const RuntimeWorld,
    entity: u32,
) -> f32 {
    with_world(world, 0.0, |world| {
        world.position(entity).unwrap_or(Vec3::ZERO).z
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_velocity_x(
    world: *const RuntimeWorld,
    entity: u32,
) -> f32 {
    with_world(world, 0.0, |world| {
        world.velocity(entity).unwrap_or(Vec3::ZERO).x
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_velocity_y(
    world: *const RuntimeWorld,
    entity: u32,
) -> f32 {
    with_world(world, 0.0, |world| {
        world.velocity(entity).unwrap_or(Vec3::ZERO).y
    })
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn zylem_runtime_world_velocity_z(
    world: *const RuntimeWorld,
    entity: u32,
) -> f32 {
    with_world(world, 0.0, |world| {
        world.velocity(entity).unwrap_or(Vec3::ZERO).z
    })
}
