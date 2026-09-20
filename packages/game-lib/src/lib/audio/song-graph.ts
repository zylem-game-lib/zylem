import type * as ToneNs from 'tone';
import { createInstrument, type Instrument } from './instrument';
import type { SongDefinition } from './song-definition';
import type { SongSchedule } from './song-math';
import type { ToneModule } from './tone-loader';

/**
 * The Tone.js node graph for one song: a channel per track, an instrument
 * per instrument track, `Part`s carrying the note events and `Player`s for
 * audio clips, all summed into `master`. Shared by the live player and the
 * offline renderer so both hear the same mix.
 */
export interface SongGraph {
	channels: Map<string, ToneNs.Channel>;
	instruments: Map<string, Instrument>;
	parts: ToneNs.Part[];
	players: ToneNs.Player[];
	dispose(): void;
}

export interface SongGraphOptions {
	master: ToneNs.InputNode;
	schedule: SongSchedule;
	/** Preloaded audio by URL; clips without a buffer are fetched by the Player. */
	buffers?: Map<string, ToneNs.ToneAudioBuffer>;
	resolveUrl?: (url: string) => string;
}

interface NoteEvent {
	time: number;
	pitch: number;
	duration: number;
	velocity: number;
}

export function buildSongGraph(Tone: ToneModule, song: SongDefinition, options: SongGraphOptions): SongGraph {
	const channels = new Map<string, ToneNs.Channel>();
	const instruments = new Map<string, Instrument>();
	const parts: ToneNs.Part[] = [];
	const players: ToneNs.Player[] = [];
	const instrumentDefs = new Map(song.instruments.map((instrument) => [instrument.id, instrument]));

	for (const track of song.tracks) {
		const channel = new Tone.Channel({
			volume: track.volume ?? 0,
			pan: track.pan ?? 0,
			mute: track.mute ?? false,
			solo: track.solo ?? false,
		});
		channel.connect(options.master);
		channels.set(track.id, channel);
		if (track.kind === 'instrument' && track.instrumentId) {
			const def = instrumentDefs.get(track.instrumentId);
			if (def) {
				const instrument = createInstrument(Tone, def);
				instrument.output.connect(channel);
				instruments.set(track.id, instrument);
			}
		}
	}

	const eventsByTrack = new Map<string, NoteEvent[]>();
	for (const note of options.schedule.notes) {
		const list = eventsByTrack.get(note.trackId) ?? [];
		list.push({ time: note.time, pitch: note.pitch, duration: note.duration, velocity: note.velocity });
		eventsByTrack.set(note.trackId, list);
	}
	for (const [trackId, events] of eventsByTrack) {
		const instrument = instruments.get(trackId);
		if (!instrument) continue;
		const part = new Tone.Part<NoteEvent>((time, event) => {
			instrument.trigger(event.pitch, event.duration, time, event.velocity);
		}, events);
		part.start(0);
		parts.push(part);
	}

	for (const clip of options.schedule.audio) {
		const channel = channels.get(clip.trackId);
		if (!channel) continue;
		const url = options.resolveUrl ? options.resolveUrl(clip.url) : clip.url;
		const buffer = options.buffers?.get(clip.url) ?? options.buffers?.get(url);
		const player = buffer ? new Tone.Player(buffer) : new Tone.Player(url);
		player.volume.value = clip.gain;
		player.connect(channel);
		player.sync().start(clip.time, clip.offset, clip.duration);
		players.push(player);
	}

	return {
		channels,
		instruments,
		parts,
		players,
		dispose() {
			for (const part of parts) part.dispose();
			for (const player of players) {
				player.unsync();
				player.dispose();
			}
			for (const instrument of instruments.values()) instrument.dispose();
			for (const channel of channels.values()) channel.dispose();
		},
	};
}
