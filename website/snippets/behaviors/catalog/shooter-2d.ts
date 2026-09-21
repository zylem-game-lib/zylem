import { createSphere } from '@zylem/game-lib/entity';
import { Shooter2DBehavior, fireShooter2DIfRequested } from '@zylem/game-lib/behavior';

const gunner = createSphere({ name: 'gunner' });

const shooter = gunner.use(Shooter2DBehavior, {
	projectileFactory: () => createSphere({ name: 'bullet' }),
	projectileSpeed: 30,
	cooldownMs: 250,
});

const stage = {
	add: (..._entities: unknown[]) => {},
};

gunner.onUpdate(({ inputs, me }) => {
	fireShooter2DIfRequested(
		me,
		shooter,
		stage,
		{
			aimX: inputs.p1.axes.SecondaryHorizontal.value,
			aimY: inputs.p1.axes.SecondaryVertical.value,
			shootPressed: inputs.p1.buttons.A.pressed,
			shootHeld: inputs.p1.buttons.A.held > 0,
		},
	);
});
