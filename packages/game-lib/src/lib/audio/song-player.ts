import type * as ToneNs from 'tone';
import type { SongDefinition, SongLoop } from './song-definition';
import { buildSongGraph, type SongGraph } from './song-graph';
import { beatsToSeconds, scheduleSong, songLengthBeats } from './song-math';
import { ensureAudio, loadTone, type ToneModule } from './tone-loader';

export type SongPlayerState = 'stopped' | 'playing' | 'paused';

export interface SongPlayerEvents {
	/** Fires at the start of every bar with the 0-based bar index. */
	bar: (bar: number) => void;
	/** Fires at the start of every beat with the 0-based beat index. */
	beat: (beat: number) => void;
	/** Fires when a non-looping song reaches its end. */
	complete: () => void;
	state: (state: SongPlayerState) => void;
}

export interface SongPlayerOptions {
	/** Resolve clip URLs (for example, relative asset paths) before loading. */
	resolveUrl?: (url: string) => string;
	/** Route the master output here instead of the speakers. */
	destination?: ToneNs.InputNode;
}

export interface SongPlayer {
	readonly definition: SongDefinition;
	readonly state: SongPlayerState;
	/** Resolves once Tone.js and every audio clip are loaded. */
	readonly ready: Promise<void>;
	/** Starts (or resumes) playback; needs a prior user gesture the first time. */
	play(fromBeat?: number): Promise<void>;
	pause(): void;
	/** Stops and rewinds to the start. */
	stop(): void;
	seek(beat: number): void;
	/** Playhead in beats. */
	position(): number;
	/** Playhead in seconds at the current tempo. */
	seconds(): number;
	setBpm(bpm: number): void;
	setLoop(loop: SongLoop | null): void;
	setTrackMute(trackId: string, mute: boolean): void;
	setTrackSolo(trackId: string, solo: boolean): void;
	/** dB. */
	setTrackVolume(trackId: string, volume: number): void;
	setTrackPan(trackId: string, pan: number): void;
	/** dB. */
	setMasterVolume(volume: number): void;
	/** Plays one note on a track's instrument right now (for auditioning). */
	preview(trackId: string, pitch: number, duration?: number, velocity?: number): Promise<void>;
	/** Swaps in a new definition, keeping the playhead and state. */
	update(definition: SongDefinition): Promise<void>;
	on<K extends keyof SongPlayerEvents>(event: K, handler: SongPlayerEvents[K]): () => void;
	dispose(): void;
}

let activePlayer: SongPlayer | null = null;

/**
 * Plays a song on Tone.js's transport. The transport is shared, so creating
 * a player disposes the previous one: one song plays at a time. Tone.js is
 * loaded lazily; the first `play()` must follow a user gesture.
 */
export function createSongPlayer(definition: SongDefinition, options: SongPlayerOptions = {}): SongPlayer {
	activePlayer?.dispose();

	let song = definition;
	let state: SongPlayerState = 'stopped';
	let Tone: ToneModule | null = null;
	let transport: ReturnType<ToneModule['getTransport']> | null = null;
	let master: ToneNs.Volume | null = null;
	let graph: SongGraph | null = null;
	let disposed = false;
	const scheduledIds: number[] = [];
	const listeners: { [K in keyof SongPlayerEvents]: Set<SongPlayerEvents[K]> } = {
		bar: new Set(),
		beat: new Set(),
		complete: new Set(),
		state: new Set(),
	};
	const buffers = new Map<string, ToneNs.ToneAudioBuffer>();

	const emit = <K extends keyof SongPlayerEvents>(event: K, ...args: Parameters<SongPlayerEvents[K]>) => {
		for (const handler of listeners[event]) (handler as (...a: unknown[]) => void)(...args);
	};
	const setState = (next: SongPlayerState) => {
		if (state === next) return;
		state = next;
		emit('state', next);
	};

	const beatsPerBar = () => (song.timeSignature.numerator * 4) / song.timeSignature.denominator;

	const clearSchedule = () => {
		if (!transport) return;
		for (const id of scheduledIds) transport.clear(id);
		scheduledIds.length = 0;
	};

	const preloadAudio = async (T: ToneModule) => {
		const urls = new Set(
			song.clips.flatMap((clip) => (clip.kind === 'audio' ? [clip.url] : [])),
		);
		await Promise.all(
			[...urls].map(async (url) => {
				if (buffers.has(url)) return;
				const resolved = options.resolveUrl ? options.resolveUrl(url) : url;
				try {
					buffers.set(url, await T.ToneAudioBuffer.fromUrl(resolved));
				} catch (error) {
					console.warn(`[zylem/audio] could not load "${resolved}"`, error);
				}
			}),
		);
	};

	const build = (T: ToneModule) => {
		if (!transport || !master) return;
		graph?.dispose();
		clearSchedule();
		transport.bpm.value = song.bpm;
		transport.timeSignature = [song.timeSignature.numerator, song.timeSignature.denominator];
		master.volume.value = song.masterVolume ?? 0;
		const schedule = scheduleSong(song);
		graph = buildSongGraph(T, song, {
			master,
			schedule,
			buffers,
			resolveUrl: options.resolveUrl,
		});
		applyLoop(song.loop ?? null);
		const lengthSeconds = schedule.length;
		scheduledIds.push(
			transport.schedule(() => {
				if (transport?.loop) return;
				T.getDraw().schedule(() => {
					stop();
					emit('complete');
				}, T.now());
			}, lengthSeconds),
		);
		scheduledIds.push(
			transport.scheduleRepeat((time: number) => {
				const beat = Math.round(transport!.getSecondsAtTime(time) / beatsToSeconds(1, transport!.bpm.value));
				T.getDraw().schedule(() => {
					emit('beat', beat);
					if (beat % beatsPerBar() === 0) emit('bar', Math.floor(beat / beatsPerBar()));
				}, time);
			}, '4n', 0),
		);
	};

	const applyLoop = (loop: SongLoop | null) => {
		if (!transport) return;
		if (loop?.enabled && loop.end > loop.start) {
			transport.loopStart = beatsToSeconds(loop.start, transport.bpm.value);
			transport.loopEnd = beatsToSeconds(loop.end, transport.bpm.value);
			transport.loop = true;
		} else {
			transport.loop = false;
		}
	};

	const ready = (async () => {
		const T = await loadTone();
		if (disposed) return;
		Tone = T;
		transport = T.getTransport();
		transport.stop();
		transport.cancel();
		transport.position = 0;
		master = new T.Volume(song.masterVolume ?? 0);
		master.connect(options.destination ?? T.getDestination());
		await preloadAudio(T);
		if (disposed) return;
		build(T);
	})();

	const ticksToBeats = (ticks: number) => (transport ? ticks / transport.PPQ : 0);

	const stop = () => {
		if (!transport) return;
		transport.stop();
		transport.position = 0;
		for (const instrument of graph?.instruments.values() ?? []) instrument.releaseAll();
		setState('stopped');
	};

	const player: SongPlayer = {
		get definition() {
			return song;
		},
		get state() {
			return state;
		},
		ready,
		async play(fromBeat) {
			if (disposed) return;
			await ensureAudio();
			await ready;
			if (disposed || !transport) return;
			if (fromBeat !== undefined) transport.ticks = Math.max(0, fromBeat) * transport.PPQ;
			transport.start();
			setState('playing');
		},
		pause() {
			if (!transport || state !== 'playing') return;
			transport.pause();
			for (const instrument of graph?.instruments.values() ?? []) instrument.releaseAll();
			setState('paused');
		},
		stop,
		seek(beat) {
			if (!transport) return;
			const clamped = Math.min(Math.max(0, beat), songLengthBeats(song));
			transport.ticks = clamped * transport.PPQ;
			for (const instrument of graph?.instruments.values() ?? []) instrument.releaseAll();
		},
		position() {
			return transport ? ticksToBeats(transport.ticks) : 0;
		},
		seconds() {
			return transport ? transport.seconds : 0;
		},
		setBpm(bpm) {
			song = { ...song, bpm };
			if (transport) {
				transport.bpm.value = bpm;
				applyLoop(song.loop ?? null);
			}
		},
		setLoop(loop) {
			song = { ...song, loop: loop ?? undefined };
			applyLoop(loop);
		},
		setTrackMute(trackId, mute) {
			const channel = graph?.channels.get(trackId);
			if (channel) channel.mute = mute;
		},
		setTrackSolo(trackId, solo) {
			const channel = graph?.channels.get(trackId);
			if (channel) channel.solo = solo;
		},
		setTrackVolume(trackId, volume) {
			const channel = graph?.channels.get(trackId);
			if (channel) channel.volume.value = volume;
		},
		setTrackPan(trackId, pan) {
			const channel = graph?.channels.get(trackId);
			if (channel) channel.pan.value = pan;
		},
		setMasterVolume(volume) {
			song = { ...song, masterVolume: volume };
			if (master) master.volume.value = volume;
		},
		async preview(trackId, pitch, duration = 0.4, velocity = 0.8) {
			await ensureAudio();
			await ready;
			graph?.instruments.get(trackId)?.trigger(pitch, duration, undefined, velocity);
		},
		async update(next) {
			song = next;
			await ready;
			if (disposed || !Tone || !transport) return;
			const wasPlaying = state === 'playing';
			const ticks = transport.ticks;
			if (wasPlaying) transport.pause();
			await preloadAudio(Tone);
			if (disposed) return;
			build(Tone);
			transport.ticks = Math.min(ticks, songLengthBeats(song) * transport.PPQ);
			if (wasPlaying) transport.start();
		},
		on(event, handler) {
			(listeners[event] as Set<typeof handler>).add(handler);
			return () => {
				(listeners[event] as Set<typeof handler>).delete(handler);
			};
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			if (transport) {
				transport.stop();
				clearSchedule();
				transport.loop = false;
			}
			graph?.dispose();
			graph = null;
			master?.dispose();
			master = null;
			for (const key of Object.keys(listeners) as Array<keyof SongPlayerEvents>) listeners[key].clear();
			if (activePlayer === player) activePlayer = null;
			state = 'stopped';
		},
	};

	activePlayer = player;
	return player;
}

/** The most recently created, still-live song player, if any. */
export function getActiveSongPlayer(): SongPlayer | null {
	return activePlayer;
}
