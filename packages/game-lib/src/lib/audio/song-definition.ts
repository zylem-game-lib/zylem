import { Type, type Static } from '@sinclair/typebox';

/**
 * TypeBox schema for a song the audio module can play: instruments (Tone.js
 * presets with an effects chain), tracks (one instrument or audio lane each)
 * and clips placed on those tracks. All positions and lengths are in beats at
 * the song's tempo; audio clips reference a URL the runtime can fetch.
 *
 * Creator's Music mode authors `.song.json` documents that strip down to this
 * shape (`toRuntimeSong` in `@zylem-creator/shared`).
 */

export const InstrumentPresetSchema = Type.Union(
	[
		Type.Literal('synth'),
		Type.Literal('polySynth'),
		Type.Literal('fmSynth'),
		Type.Literal('amSynth'),
		Type.Literal('membraneSynth'),
		Type.Literal('metalSynth'),
		Type.Literal('noiseSynth'),
		Type.Literal('pluckSynth'),
	],
	{ title: 'InstrumentPreset' },
);
export type InstrumentPreset = Static<typeof InstrumentPresetSchema>;

export const OscillatorTypeSchema = Type.Union(
	[Type.Literal('sine'), Type.Literal('square'), Type.Literal('sawtooth'), Type.Literal('triangle')],
	{ title: 'OscillatorType' },
);
export type OscillatorType = Static<typeof OscillatorTypeSchema>;

export const EnvelopeSchema = Type.Object(
	{
		attack: Type.Number({ minimum: 0 }),
		decay: Type.Number({ minimum: 0 }),
		sustain: Type.Number({ minimum: 0, maximum: 1 }),
		release: Type.Number({ minimum: 0 }),
	},
	{ title: 'Envelope', additionalProperties: false },
);
export type Envelope = Static<typeof EnvelopeSchema>;

export const EffectTypeSchema = Type.Union(
	[Type.Literal('reverb'), Type.Literal('delay'), Type.Literal('distortion'), Type.Literal('filter')],
	{ title: 'EffectType' },
);
export type EffectType = Static<typeof EffectTypeSchema>;

export const InstrumentEffectSchema = Type.Object(
	{
		id: Type.String(),
		type: EffectTypeSchema,
		/** Dry/wet mix, 0–1. */
		wet: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
		/** Effect-specific settings forwarded to the Tone.js constructor. */
		options: Type.Optional(
			Type.Record(Type.String(), Type.Union([Type.Number(), Type.String(), Type.Boolean()])),
		),
	},
	{ title: 'InstrumentEffect', additionalProperties: false },
);
export type InstrumentEffect = Static<typeof InstrumentEffectSchema>;

export const InstrumentDefinitionSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		preset: InstrumentPresetSchema,
		oscillator: Type.Optional(OscillatorTypeSchema),
		envelope: Type.Optional(EnvelopeSchema),
		/** Output trim in dB. */
		volume: Type.Optional(Type.Number()),
		effects: Type.Optional(Type.Array(InstrumentEffectSchema)),
	},
	{ title: 'InstrumentDefinition', additionalProperties: false },
);
export type InstrumentDefinition = Static<typeof InstrumentDefinitionSchema>;

export const SongNoteSchema = Type.Object(
	{
		id: Type.Optional(Type.String()),
		/** MIDI pitch, 0–127. */
		pitch: Type.Integer({ minimum: 0, maximum: 127 }),
		/** Beats from the clip start. */
		start: Type.Number({ minimum: 0 }),
		/** Beats. */
		duration: Type.Number({ exclusiveMinimum: 0 }),
		/** 0–1; defaults to 0.8. */
		velocity: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
	},
	{ title: 'SongNote', additionalProperties: false },
);
export type SongNote = Static<typeof SongNoteSchema>;

export const SongTrackSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		kind: Type.Union([Type.Literal('instrument'), Type.Literal('audio')]),
		instrumentId: Type.Optional(Type.String()),
		color: Type.Optional(Type.String()),
		/** Fader in dB. */
		volume: Type.Optional(Type.Number()),
		/** -1 (left) … 1 (right). */
		pan: Type.Optional(Type.Number({ minimum: -1, maximum: 1 })),
		mute: Type.Optional(Type.Boolean()),
		solo: Type.Optional(Type.Boolean()),
	},
	{ title: 'SongTrack', additionalProperties: false },
);
export type SongTrack = Static<typeof SongTrackSchema>;

export const NoteClipSchema = Type.Object(
	{
		kind: Type.Literal('notes'),
		id: Type.String(),
		trackId: Type.String(),
		name: Type.Optional(Type.String()),
		/** Beats from the song start. */
		start: Type.Number({ minimum: 0 }),
		/** Beats; notes past the end are not played. */
		length: Type.Number({ exclusiveMinimum: 0 }),
		notes: Type.Array(SongNoteSchema),
	},
	{ title: 'NoteClip', additionalProperties: false },
);
export type NoteClip = Static<typeof NoteClipSchema>;

export const AudioClipSchema = Type.Object(
	{
		kind: Type.Literal('audio'),
		id: Type.String(),
		trackId: Type.String(),
		name: Type.Optional(Type.String()),
		/** URL of the audio file. */
		url: Type.String(),
		/** Beats from the song start. */
		start: Type.Number({ minimum: 0 }),
		/** Seconds trimmed from the start of the file. */
		offset: Type.Optional(Type.Number({ minimum: 0 })),
		/** Beats. */
		length: Type.Number({ exclusiveMinimum: 0 }),
		/** Clip gain in dB. */
		gain: Type.Optional(Type.Number()),
	},
	{ title: 'AudioClip', additionalProperties: false },
);
export type AudioClip = Static<typeof AudioClipSchema>;

export const SongClipSchema = Type.Union([NoteClipSchema, AudioClipSchema], { title: 'SongClip' });
export type SongClip = Static<typeof SongClipSchema>;

export const TimeSignatureSchema = Type.Object(
	{
		numerator: Type.Integer({ minimum: 1 }),
		denominator: Type.Integer({ minimum: 1 }),
	},
	{ title: 'TimeSignature', additionalProperties: false },
);
export type TimeSignature = Static<typeof TimeSignatureSchema>;

export const SongLoopSchema = Type.Object(
	{
		enabled: Type.Boolean(),
		/** Beats. */
		start: Type.Number({ minimum: 0 }),
		end: Type.Number({ exclusiveMinimum: 0 }),
	},
	{ title: 'SongLoop', additionalProperties: false },
);
export type SongLoop = Static<typeof SongLoopSchema>;

export const SongDefinitionSchema = Type.Object(
	{
		id: Type.String(),
		name: Type.String(),
		bpm: Type.Number({ exclusiveMinimum: 0 }),
		timeSignature: TimeSignatureSchema,
		lengthBars: Type.Integer({ minimum: 1 }),
		loop: Type.Optional(SongLoopSchema),
		instruments: Type.Array(InstrumentDefinitionSchema),
		tracks: Type.Array(SongTrackSchema),
		clips: Type.Array(SongClipSchema),
		/** Master fader in dB. */
		masterVolume: Type.Optional(Type.Number()),
	},
	{ $id: 'SongDefinition', title: 'SongDefinition', additionalProperties: false },
);
export type SongDefinition = Static<typeof SongDefinitionSchema>;
