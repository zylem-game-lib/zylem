import type { AudioClip, NoteClip, SongDefinition, SongTrack, TimeSignature } from './song-definition';

/**
 * Pure timing and scheduling math for songs. Everything here runs without
 * an AudioContext so the player, the offline renderer and the editor agree
 * on when things happen.
 */

/** Quarter-note beats per bar: 4/4 → 4, 6/8 → 3, 3/4 → 3. */
export function beatsPerBar(signature: TimeSignature): number {
	return (signature.numerator * 4) / signature.denominator;
}

export function songLengthBeats(song: Pick<SongDefinition, 'lengthBars' | 'timeSignature'>): number {
	return song.lengthBars * beatsPerBar(song.timeSignature);
}

export function beatsToSeconds(beats: number, bpm: number): number {
	return (beats * 60) / bpm;
}

export function secondsToBeats(seconds: number, bpm: number): number {
	return (seconds * bpm) / 60;
}

export function songLengthSeconds(song: Pick<SongDefinition, 'lengthBars' | 'timeSignature' | 'bpm'>): number {
	return beatsToSeconds(songLengthBeats(song), song.bpm);
}

/** MIDI pitch to Hz with A4 = 440. */
export function midiToFrequency(pitch: number): number {
	return 440 * 2 ** ((pitch - 69) / 12);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/** `60` → `C4`, the spelling Tone.js accepts as a note name. */
export function midiToNoteName(pitch: number): string {
	const rounded = Math.round(pitch);
	return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}

export function dbToGain(db: number): number {
	return 10 ** (db / 20);
}

export function gainToDb(gain: number): number {
	return gain <= 0 ? Number.NEGATIVE_INFINITY : 20 * Math.log10(gain);
}

/**
 * Tracks that actually make sound: when any track is soloed only the soloed,
 * unmuted ones play; otherwise everything not muted.
 */
export function audibleTrackIds(tracks: readonly SongTrack[]): Set<string> {
	const anySolo = tracks.some((track) => track.solo);
	const audible = new Set<string>();
	for (const track of tracks) {
		if (track.mute) continue;
		if (anySolo && !track.solo) continue;
		audible.add(track.id);
	}
	return audible;
}

export interface ScheduledNote {
	trackId: string;
	clipId: string;
	instrumentId: string;
	/** Seconds from the song start. */
	time: number;
	/** Seconds. */
	duration: number;
	pitch: number;
	velocity: number;
}

export interface ScheduledAudio {
	trackId: string;
	clipId: string;
	url: string;
	/** Seconds from the song start. */
	time: number;
	/** Seconds into the file. */
	offset: number;
	/** Seconds. */
	duration: number;
	/** dB. */
	gain: number;
}

export interface SongSchedule {
	notes: ScheduledNote[];
	audio: ScheduledAudio[];
	/** Seconds. */
	length: number;
}

export interface ScheduleOptions {
	/** Only schedule these tracks (mute/solo are still honored). */
	trackIds?: Iterable<string>;
	/** Ignore mute/solo and schedule every listed track. */
	ignoreMix?: boolean;
}

/**
 * Flattens a song into absolute note and audio events in seconds. Notes are
 * clipped to their clip's length and to the song end; audio clips are
 * clipped to the song end.
 */
export function scheduleSong(song: SongDefinition, options: ScheduleOptions = {}): SongSchedule {
	const lengthBeats = songLengthBeats(song);
	const audible = options.ignoreMix ? new Set(song.tracks.map((track) => track.id)) : audibleTrackIds(song.tracks);
	const wanted = options.trackIds ? new Set(options.trackIds) : null;
	const tracks = new Map(song.tracks.map((track) => [track.id, track]));
	const notes: ScheduledNote[] = [];
	const audio: ScheduledAudio[] = [];

	for (const clip of song.clips) {
		const track = tracks.get(clip.trackId);
		if (!track || !audible.has(track.id) || (wanted && !wanted.has(track.id))) continue;
		if (clip.start >= lengthBeats) continue;
		const clipEnd = Math.min(clip.start + clip.length, lengthBeats);
		if (clip.kind === 'notes') {
			if (track.kind !== 'instrument' || !track.instrumentId) continue;
			for (const note of clip.notes) {
				const start = clip.start + note.start;
				if (start >= clipEnd) continue;
				const end = Math.min(start + note.duration, clipEnd);
				if (end <= start) continue;
				notes.push({
					trackId: track.id,
					clipId: clip.id,
					instrumentId: track.instrumentId,
					time: beatsToSeconds(start, song.bpm),
					duration: beatsToSeconds(end - start, song.bpm),
					pitch: note.pitch,
					velocity: note.velocity ?? 0.8,
				});
			}
		} else {
			audio.push({
				trackId: track.id,
				clipId: clip.id,
				url: clip.url,
				time: beatsToSeconds(clip.start, song.bpm),
				offset: clip.offset ?? 0,
				duration: beatsToSeconds(clipEnd - clip.start, song.bpm),
				gain: clip.gain ?? 0,
			});
		}
	}

	notes.sort((a, b) => a.time - b.time);
	audio.sort((a, b) => a.time - b.time);
	return { notes, audio, length: beatsToSeconds(lengthBeats, song.bpm) };
}

/** Clips whose window covers `beat` on a track. */
export function clipsAt(song: SongDefinition, trackId: string, beat: number): Array<NoteClip | AudioClip> {
	return song.clips.filter(
		(clip) => clip.trackId === trackId && beat >= clip.start && beat < clip.start + clip.length,
	);
}
