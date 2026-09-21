import { createSphere } from '@zylem/game-lib/entity';
import { ParticleEmitterBehavior, particlePresets } from '@zylem/game-lib/behavior';

const torch = createSphere({ name: 'torch' });

const emitter = torch.use(ParticleEmitterBehavior, {
	effect: particlePresets.fire.blaze(),
	autoplay: true,
	followPosition: true,
	followRotation: false,
	autoDestroy: false,
});

torch.onUpdate(() => {
	if (!emitter.isPlaying()) {
		emitter.play();
	}
});
