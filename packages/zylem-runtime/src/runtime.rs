pub type EntityId = u32;

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Vec3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

impl Vec3 {
    pub const ZERO: Self = Self::new(0.0, 0.0, 0.0);

    pub const fn new(x: f32, y: f32, z: f32) -> Self {
        Self { x, y, z }
    }

    pub fn integrate(&mut self, velocity: Self, delta_seconds: f32) {
        self.x += velocity.x * delta_seconds;
        self.y += velocity.y * delta_seconds;
        self.z += velocity.z * delta_seconds;
    }
}

#[repr(C)]
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct RuntimeStats {
    pub live_entities: u32,
    pub allocated_entities: u32,
    pub tick_count: u32,
}

#[derive(Debug, Default)]
pub struct RuntimeWorld {
    next_entity: EntityId,
    alive: Vec<bool>,
    positions: Vec<Option<Vec3>>,
    velocities: Vec<Option<Vec3>>,
    tick_count: u32,
}

impl RuntimeWorld {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn spawn(&mut self) -> EntityId {
        let entity = self.next_entity;
        self.next_entity = self.next_entity.saturating_add(1);
        self.alive.push(true);
        self.positions.push(None);
        self.velocities.push(None);
        entity
    }

    pub fn despawn(&mut self, entity: EntityId) -> bool {
        let Some(index) = self.index(entity) else {
            return false;
        };

        if !self.alive[index] {
            return false;
        }

        self.alive[index] = false;
        self.positions[index] = None;
        self.velocities[index] = None;
        true
    }

    pub fn is_alive(&self, entity: EntityId) -> bool {
        self.index(entity)
            .and_then(|index| self.alive.get(index))
            .copied()
            .unwrap_or(false)
    }

    pub fn set_position(&mut self, entity: EntityId, position: Vec3) -> bool {
        let Some(index) = self.live_index(entity) else {
            return false;
        };

        self.positions[index] = Some(position);
        true
    }

    pub fn position(&self, entity: EntityId) -> Option<Vec3> {
        self.read_component(entity, &self.positions)
    }

    pub fn set_velocity(&mut self, entity: EntityId, velocity: Vec3) -> bool {
        let Some(index) = self.live_index(entity) else {
            return false;
        };

        self.velocities[index] = Some(velocity);
        true
    }

    pub fn velocity(&self, entity: EntityId) -> Option<Vec3> {
        self.read_component(entity, &self.velocities)
    }

    pub fn step(&mut self, delta_seconds: f32) {
        for index in 0..self.alive.len() {
            if !self.alive[index] {
                continue;
            }

            let Some(velocity) = self.velocities[index] else {
                continue;
            };

            let position = self.positions[index].get_or_insert(Vec3::ZERO);
            position.integrate(velocity, delta_seconds);
        }

        self.tick_count = self.tick_count.saturating_add(1);
    }

    pub fn stats(&self) -> RuntimeStats {
        RuntimeStats {
            live_entities: self.alive.iter().filter(|alive| **alive).count() as u32,
            allocated_entities: self.next_entity,
            tick_count: self.tick_count,
        }
    }

    fn index(&self, entity: EntityId) -> Option<usize> {
        let index = entity as usize;
        (index < self.alive.len()).then_some(index)
    }

    fn live_index(&self, entity: EntityId) -> Option<usize> {
        let index = self.index(entity)?;
        self.alive[index].then_some(index)
    }

    fn read_component(&self, entity: EntityId, storage: &[Option<Vec3>]) -> Option<Vec3> {
        let index = self.live_index(entity)?;
        storage[index]
    }
}

#[cfg(test)]
mod tests {
    use super::{RuntimeWorld, Vec3};

    #[test]
    fn integrates_velocity_into_position() {
        let mut world = RuntimeWorld::new();
        let entity = world.spawn();

        assert!(world.set_position(entity, Vec3::new(1.0, 2.0, 3.0)));
        assert!(world.set_velocity(entity, Vec3::new(4.0, -2.0, 0.5)));

        world.step(0.5);

        assert_eq!(world.position(entity), Some(Vec3::new(3.0, 1.0, 3.25)));
        assert_eq!(world.stats().tick_count, 1);
    }

    #[test]
    fn despawn_clears_components() {
        let mut world = RuntimeWorld::new();
        let entity = world.spawn();

        assert!(world.set_velocity(entity, Vec3::new(1.0, 0.0, 0.0)));
        assert!(world.despawn(entity));
        assert!(!world.is_alive(entity));
        assert_eq!(world.velocity(entity), None);
        assert!(!world.set_position(entity, Vec3::new(0.0, 0.0, 0.0)));
    }
}
