/**
 * Plays a ping-pong beep sound effect.
 */
export function pingPongBeep(frequency: number = 440, duration: number = 0.1) {
	_pingPongBeep(frequency, duration);
}

function _pingPongBeep(frequency: number, duration: number) {
	const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
	const oscillator = audioCtx.createOscillator();
	const gain = audioCtx.createGain();

	oscillator.type = 'square';
	oscillator.frequency.value = frequency;

	gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

	oscillator.connect(gain);
	gain.connect(audioCtx.destination);

	oscillator.start();
	oscillator.stop(audioCtx.currentTime + duration);
} 