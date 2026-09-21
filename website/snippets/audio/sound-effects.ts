import { Howl, pingPongBeep, ricochetSound } from '@zylem/game-lib/audio';

/** Built-in procedural one-shots (Web Audio oscillators). */
export function playBuiltInSfx() {
	ricochetSound(800, 0.05);
	pingPongBeep(440, 0.1);
}

/** Sample or streamed SFX through Howler. */
export function playFileSfx(url: string) {
	const howl = new Howl({ src: [url], volume: 0.5 });
	howl.play();
}
