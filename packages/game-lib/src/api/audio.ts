/**
 * `@zylem/game-lib/audio` public API.
 *
 * One-shot helpers ride on Howler; songs authored in Creator's Music mode
 * play through Tone.js, which is loaded on demand the first time a song
 * player or renderer is used.
 * @public
 */
export { ricochetSound } from '../lib/sounds/ricochet-sound';
export { pingPongBeep } from '../lib/sounds/ping-pong-sound';
export { Howl } from 'howler';

export {
	SongDefinitionSchema,
	InstrumentDefinitionSchema,
	InstrumentEffectSchema,
	InstrumentPresetSchema,
	SongTrackSchema,
	SongClipSchema,
	NoteClipSchema,
	AudioClipSchema,
	SongNoteSchema,
	TimeSignatureSchema,
	SongLoopSchema,
	type SongDefinition,
	type InstrumentDefinition,
	type InstrumentEffect,
	type InstrumentPreset,
	type OscillatorType,
	type Envelope,
	type EffectType,
	type SongTrack,
	type SongClip,
	type NoteClip,
	type AudioClip,
	type SongNote,
	type TimeSignature,
	type SongLoop,
} from '../lib/audio/song-definition';
export {
	beatsPerBar,
	beatsToSeconds,
	secondsToBeats,
	songLengthBeats,
	songLengthSeconds,
	midiToFrequency,
	midiToNoteName,
	dbToGain,
	gainToDb,
	audibleTrackIds,
	scheduleSong,
	clipsAt,
	type ScheduledNote,
	type ScheduledAudio,
	type SongSchedule,
	type ScheduleOptions,
} from '../lib/audio/song-math';
export { loadTone, ensureAudio, isAudioReady, type ToneModule } from '../lib/audio/tone-loader';
export { createInstrument, type Instrument } from '../lib/audio/instrument';
export {
	createSongPlayer,
	getActiveSongPlayer,
	type SongPlayer,
	type SongPlayerOptions,
	type SongPlayerState,
	type SongPlayerEvents,
} from '../lib/audio/song-player';
export { renderSong, type RenderSongOptions } from '../lib/audio/render';
export { encodeWav, encodeWavBlob, type PcmSource } from '../lib/audio/wav';
