import {
	encodeWavBlob,
	renderSong,
	type SongDefinition,
} from '@zylem/game-lib/audio';

const demoSong: SongDefinition = {
	id: 'bounce',
	name: 'Bounce',
	bpm: 120,
	timeSignature: { numerator: 4, denominator: 4 },
	lengthBars: 2,
	instruments: [{ id: 'bass', name: 'Bass', preset: 'membraneSynth' }],
	tracks: [
		{
			id: 't1',
			name: 'Drums',
			kind: 'instrument',
			instrumentId: 'bass',
		},
	],
	clips: [
		{
			kind: 'notes',
			id: 'c1',
			trackId: 't1',
			start: 0,
			length: 8,
			notes: [
				{ pitch: 36, start: 0, duration: 0.25 },
				{ pitch: 36, start: 2, duration: 0.25 },
			],
		},
	],
};

/** Offline bounce — no user gesture required. */
export async function exportDemoWav(): Promise<Blob> {
	const buffer = await renderSong(demoSong, { tail: 2 });
	return encodeWavBlob(buffer);
}
