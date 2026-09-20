import type * as ToneNs from 'tone';
import type { SongDefinition } from './song-definition';
import { buildSongGraph } from './song-graph';
import { scheduleSong } from './song-math';
import { loadTone } from './tone-loader';

export interface RenderSongOptions {
	/** Render only these tracks (mute/solo are ignored so a muted track can still be bounced). */
	trackIds?: Iterable<string>;
	sampleRate?: number;
	/** Extra seconds after the song end so releases and reverb tails finish. */
	tail?: number;
	resolveUrl?: (url: string) => string;
}

/**
 * Renders a song (or a subset of its tracks) to an `AudioBuffer` offline,
 * faster than real time. Pair with `encodeWav` to get a file. Works without
 * a user gesture: offline contexts do not need to be resumed.
 */
export async function renderSong(song: SongDefinition, options: RenderSongOptions = {}): Promise<AudioBuffer> {
	const Tone = await loadTone();
	const trackIds = options.trackIds ? [...options.trackIds] : undefined;
	const schedule = scheduleSong(song, { trackIds, ignoreMix: Boolean(trackIds) });
	const buffers = new Map<string, ToneNs.ToneAudioBuffer>();
	await Promise.all(
		[...new Set(schedule.audio.map((clip) => clip.url))].map(async (url) => {
			const resolved = options.resolveUrl ? options.resolveUrl(url) : url;
			buffers.set(url, await Tone.ToneAudioBuffer.fromUrl(resolved));
		}),
	);
	const duration = Math.max(0.1, schedule.length + (options.tail ?? 1.5));
	const subset: SongDefinition = trackIds
		? {
				...song,
				tracks: song.tracks
					.filter((track) => trackIds.includes(track.id))
					.map((track) => ({ ...track, mute: false, solo: false })),
			}
		: song;
	const rendered = await Tone.Offline(
		({ transport }) => {
			transport.bpm.value = song.bpm;
			const master = new Tone.Volume(song.masterVolume ?? 0).toDestination();
			buildSongGraph(Tone, subset, { master, schedule, buffers, resolveUrl: options.resolveUrl });
			transport.start(0);
		},
		duration,
		2,
		options.sampleRate ?? 44100,
	);
	const buffer = rendered.get();
	if (!buffer) throw new Error('Offline render produced no audio');
	return buffer;
}
