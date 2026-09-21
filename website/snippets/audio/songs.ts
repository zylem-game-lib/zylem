import {
	createSongPlayer,
	ensureAudio,
	type SongDefinition,
} from '@zylem/game-lib/audio';

const demoSong: SongDefinition = {
	id: 'demo',
	name: 'Demo',
	bpm: 120,
	timeSignature: { numerator: 4, denominator: 4 },
	lengthBars: 1,
	instruments: [{ id: 'lead', name: 'Lead', preset: 'synth' }],
	tracks: [
		{
			id: 't1',
			name: 'Melody',
			kind: 'instrument',
			instrumentId: 'lead',
		},
	],
	clips: [
		{
			kind: 'notes',
			id: 'c1',
			trackId: 't1',
			start: 0,
			length: 4,
			notes: [{ pitch: 60, start: 0, duration: 1, velocity: 0.8 }],
		},
	],
};

/**
 * Call from a click or key handler so the browser allows audio output.
 * Tone.js is downloaded on the first song player or render call.
 */
export async function playDemoSong() {
	await ensureAudio();
	const player = createSongPlayer(demoSong);
	await player.ready;
	await player.play();
	player.on('complete', () => player.dispose());
}
