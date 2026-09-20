import { describe, expect, it } from 'vitest';

import type { SongDefinition } from '../../../src/lib/audio/song-definition';
import {
	audibleTrackIds,
	beatsPerBar,
	beatsToSeconds,
	midiToFrequency,
	midiToNoteName,
	scheduleSong,
	secondsToBeats,
	songLengthBeats,
	songLengthSeconds,
} from '../../../src/lib/audio/song-math';
import { encodeWav } from '../../../src/lib/audio/wav';

const song: SongDefinition = {
	id: 'song',
	name: 'Test',
	bpm: 120,
	timeSignature: { numerator: 4, denominator: 4 },
	lengthBars: 2,
	instruments: [{ id: 'lead', name: 'Lead', preset: 'synth' }],
	tracks: [
		{ id: 't1', name: 'Lead', kind: 'instrument', instrumentId: 'lead' },
		{ id: 't2', name: 'Loop', kind: 'audio' },
	],
	clips: [
		{
			kind: 'notes',
			id: 'c1',
			trackId: 't1',
			start: 4,
			length: 2,
			notes: [
				{ pitch: 60, start: 0, duration: 1 },
				{ pitch: 64, start: 1.5, duration: 2, velocity: 0.5 },
				{ pitch: 67, start: 3, duration: 1 },
			],
		},
		{ kind: 'audio', id: 'c2', trackId: 't2', url: 'loop.wav', start: 6, length: 4, offset: 0.5, gain: -3 },
	],
};

describe('song timing', () => {
	it('normalises time signatures to quarter-note beats', () => {
		expect(beatsPerBar({ numerator: 4, denominator: 4 })).toBe(4);
		expect(beatsPerBar({ numerator: 6, denominator: 8 })).toBe(3);
		expect(beatsPerBar({ numerator: 3, denominator: 4 })).toBe(3);
	});

	it('converts beats and seconds at the tempo', () => {
		expect(beatsToSeconds(4, 120)).toBe(2);
		expect(secondsToBeats(2, 120)).toBe(4);
		expect(songLengthBeats(song)).toBe(8);
		expect(songLengthSeconds(song)).toBe(4);
	});

	it('names and tunes MIDI pitches', () => {
		expect(midiToNoteName(60)).toBe('C4');
		expect(midiToNoteName(70)).toBe('A#4');
		expect(midiToFrequency(69)).toBe(440);
		expect(midiToFrequency(57)).toBeCloseTo(220);
	});
});

describe('audibleTrackIds', () => {
	it('honours mute, and solo overrides everything else', () => {
		expect([...audibleTrackIds(song.tracks)]).toEqual(['t1', 't2']);
		expect([...audibleTrackIds([{ ...song.tracks[0], mute: true }, song.tracks[1]])]).toEqual(['t2']);
		expect([...audibleTrackIds([{ ...song.tracks[0], solo: true }, song.tracks[1]])]).toEqual(['t1']);
		expect([...audibleTrackIds([{ ...song.tracks[0], solo: true, mute: true }, song.tracks[1]])]).toEqual([]);
	});
});

describe('scheduleSong', () => {
	it('flattens notes into absolute seconds, clipped to the clip and the song', () => {
		const { notes, length } = scheduleSong(song);
		expect(length).toBe(4);
		// Clip starts at beat 4 (2s); the third note starts past the clip's 2-beat window.
		expect(notes.map((note) => [note.time, note.duration, note.pitch, note.velocity])).toEqual([
			[2, 0.5, 60, 0.8],
			[2.75, 0.25, 64, 0.5],
		]);
		expect(notes[0]?.instrumentId).toBe('lead');
	});

	it('schedules audio clips with their trim and gain, clipped to the song end', () => {
		const { audio } = scheduleSong(song);
		expect(audio).toEqual([
			{ trackId: 't2', clipId: 'c2', url: 'loop.wav', time: 3, offset: 0.5, duration: 1, gain: -3 },
		]);
	});

	it('drops muted tracks unless the mix is ignored, and filters by track', () => {
		const muted: SongDefinition = { ...song, tracks: [{ ...song.tracks[0], mute: true }, song.tracks[1]] };
		expect(scheduleSong(muted).notes).toEqual([]);
		expect(scheduleSong(muted, { ignoreMix: true }).notes).toHaveLength(2);
		expect(scheduleSong(song, { trackIds: ['t2'] }).notes).toEqual([]);
		expect(scheduleSong(song, { trackIds: ['t2'] }).audio).toHaveLength(1);
	});
});

describe('encodeWav', () => {
	it('writes a 16-bit PCM RIFF header and interleaved samples', () => {
		const left = Float32Array.from([0, 1, -1, 0.5]);
		const right = Float32Array.from([0, -1, 1, -0.5]);
		const wav = encodeWav({
			numberOfChannels: 2,
			sampleRate: 8000,
			length: 4,
			getChannelData: (channel) => (channel === 0 ? left : right),
		});
		const view = new DataView(wav);
		const ascii = (offset: number, length: number) =>
			String.fromCharCode(...new Uint8Array(wav, offset, length));
		expect(wav.byteLength).toBe(44 + 4 * 2 * 2);
		expect(ascii(0, 4)).toBe('RIFF');
		expect(ascii(8, 4)).toBe('WAVE');
		expect(view.getUint16(22, true)).toBe(2);
		expect(view.getUint32(24, true)).toBe(8000);
		expect(view.getUint16(34, true)).toBe(16);
		expect(view.getUint32(40, true)).toBe(16);
		expect(view.getInt16(44, true)).toBe(0);
		expect(view.getInt16(48, true)).toBe(0x7fff);
		expect(view.getInt16(50, true)).toBe(-0x8000);
		expect(view.getInt16(52, true)).toBe(-0x8000);
	});
});
