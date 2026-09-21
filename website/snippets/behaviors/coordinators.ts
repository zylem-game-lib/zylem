import { createSphere } from '@zylem/game-lib/entity';
import {
	Shooter2DBehavior,
	TopDownMovementBehavior,
	TopDownShooterCoordinator,
} from '@zylem/game-lib/behavior';

const player = createSphere({ name: 'player' });

const shooter = player.use(Shooter2DBehavior, {
	projectileFactory: () => createSphere({ name: 'bullet' }),
	projectileSpeed: 24,
	cooldownMs: 200,
});

player.use(TopDownMovementBehavior, { moveSpeed: 10, faceMovement: false });

const stage = {
	add: (..._entities: unknown[]) => {},
};

const coordinator = new TopDownShooterCoordinator(player, shooter, stage);

player.onUpdate(({ inputs }) => {
	coordinator.update({
		moveX: inputs.p1.axes.Horizontal.value,
		moveY: inputs.p1.axes.Vertical.value,
		aimX: inputs.p1.axes.SecondaryHorizontal.value,
		aimY: inputs.p1.axes.SecondaryVertical.value,
		shootPressed: inputs.p1.buttons.A.pressed,
		shootHeld: inputs.p1.buttons.A.held > 0,
	});
});
