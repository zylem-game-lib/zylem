import type * as ToneNs from 'tone';
import type { InstrumentDefinition, InstrumentEffect } from './song-definition';
import { midiToNoteName } from './song-math';
import type { ToneModule } from './tone-loader';

/**
 * A playable instrument: a Tone.js synth for the preset, its effects chain,
 * and an output node the song player routes into a track channel.
 */
export interface Instrument {
	readonly definition: InstrumentDefinition;
	/** Connect this to a channel or destination. */
	readonly output: ToneNs.ToneAudioNode;
	/** Plays a note. `time` is in the Tone context clock (seconds); omit for now. */
	trigger(pitch: number, duration: number, time?: number, velocity?: number): void;
	/** Silences ringing notes. */
	releaseAll(time?: number): void;
	dispose(): void;
}

type AnySynth = {
	triggerAttackRelease: (...args: any[]) => unknown;
	releaseAll?: (time?: number) => unknown;
	triggerRelease?: (...args: any[]) => unknown;
	connect: (node: ToneNs.InputNode) => unknown;
	chain: (...nodes: ToneNs.InputNode[]) => unknown;
	dispose: () => unknown;
};

const DEFAULT_ENVELOPE = { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4 };

function buildSynth(Tone: ToneModule, def: InstrumentDefinition): { synth: AnySynth; pitched: boolean } {
	const envelope = def.envelope ?? DEFAULT_ENVELOPE;
	const oscillator = { type: def.oscillator ?? 'triangle' } as const;
	const volume = def.volume ?? -6;
	switch (def.preset) {
		case 'polySynth':
			return {
				synth: new Tone.PolySynth(Tone.Synth, { oscillator, envelope, volume } as any) as unknown as AnySynth,
				pitched: true,
			};
		case 'fmSynth':
			return { synth: new Tone.FMSynth({ oscillator, envelope, volume } as any) as unknown as AnySynth, pitched: true };
		case 'amSynth':
			return { synth: new Tone.AMSynth({ oscillator, envelope, volume } as any) as unknown as AnySynth, pitched: true };
		case 'membraneSynth':
			return {
				synth: new Tone.MembraneSynth({ envelope, volume, octaves: 6, pitchDecay: 0.05 } as any) as unknown as AnySynth,
				pitched: true,
			};
		case 'metalSynth':
			return {
				synth: new Tone.MetalSynth({
					envelope: { attack: envelope.attack, decay: envelope.decay, release: envelope.release },
					volume,
				} as any) as unknown as AnySynth,
				pitched: true,
			};
		case 'noiseSynth':
			return {
				synth: new Tone.NoiseSynth({
					envelope: { attack: envelope.attack, decay: envelope.decay, sustain: envelope.sustain, release: envelope.release },
					volume,
				} as any) as unknown as AnySynth,
				pitched: false,
			};
		case 'pluckSynth':
			return { synth: new Tone.PluckSynth({ volume, release: envelope.release } as any) as unknown as AnySynth, pitched: true };
		default:
			return { synth: new Tone.Synth({ oscillator, envelope, volume } as any) as unknown as AnySynth, pitched: true };
	}
}

function buildEffect(Tone: ToneModule, effect: InstrumentEffect): ToneNs.ToneAudioNode {
	const options = effect.options ?? {};
	const wet = effect.wet ?? 1;
	switch (effect.type) {
		case 'reverb':
			return new Tone.Reverb({ decay: num(options.decay, 2), preDelay: num(options.preDelay, 0.01), wet });
		case 'delay':
			return new Tone.FeedbackDelay({
				delayTime: num(options.delayTime, 0.25),
				feedback: num(options.feedback, 0.35),
				wet,
			});
		case 'distortion':
			return new Tone.Distortion({ distortion: num(options.distortion, 0.4), wet });
		case 'filter':
			return new Tone.Filter({
				frequency: num(options.frequency, 1200),
				type: (typeof options.type === 'string' ? options.type : 'lowpass') as BiquadFilterType,
				Q: num(options.Q, 1),
			});
		default:
			return new Tone.Gain(1);
	}
}

function num(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Builds the synth and effects chain for an instrument definition. The
 * returned `output` is not connected anywhere; the caller routes it.
 */
export function createInstrument(Tone: ToneModule, def: InstrumentDefinition): Instrument {
	const { synth, pitched } = buildSynth(Tone, def);
	const effects = (def.effects ?? []).map((effect) => buildEffect(Tone, effect));
	const output = new Tone.Gain(1);
	if (effects.length > 0) synth.chain(...effects, output);
	else synth.connect(output);

	return {
		definition: def,
		output,
		trigger(pitch, duration, time, velocity = 0.8) {
			const safeDuration = Math.max(0.01, duration);
			if (pitched) synth.triggerAttackRelease(midiToNoteName(pitch), safeDuration, time, velocity);
			else synth.triggerAttackRelease(safeDuration, time, velocity);
		},
		releaseAll(time) {
			if (synth.releaseAll) synth.releaseAll(time);
			else synth.triggerRelease?.(time);
		},
		dispose() {
			synth.dispose();
			for (const effect of effects) effect.dispose();
			output.dispose();
		},
	};
}
