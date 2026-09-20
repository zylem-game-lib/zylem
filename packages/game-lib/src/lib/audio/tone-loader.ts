/**
 * Tone.js is loaded on demand so games without music never download it, and
 * so the AudioContext is only started after a user gesture (browsers refuse
 * to start one otherwise).
 */

export type ToneModule = typeof import('tone');

let tonePromise: Promise<ToneModule> | null = null;
let started = false;

/** Loads Tone.js (once) without touching the AudioContext. */
export function loadTone(): Promise<ToneModule> {
	if (!tonePromise) {
		tonePromise = import('tone').then((module) => {
			// Some bundlers wrap the namespace in `default`; unwrap when `start` is missing.
			const loaded = module as unknown as ToneModule & { default?: ToneModule };
			return typeof loaded.start === 'function' ? loaded : (loaded.default ?? loaded);
		});
	}
	return tonePromise;
}

/**
 * Loads Tone.js and resumes the AudioContext. Call from a click or key
 * handler the first time; later calls are cheap.
 */
export async function ensureAudio(): Promise<ToneModule> {
	const Tone = await loadTone();
	if (!started || Tone.getContext().state !== 'running') {
		try {
			await Tone.start();
			started = true;
		} catch {
			// Not in a user gesture yet; the caller can retry on the next one.
		}
	}
	return Tone;
}

/** True once `ensureAudio()` has successfully started the context. */
export function isAudioReady(): boolean {
	return started;
}
