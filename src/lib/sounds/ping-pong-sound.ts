/**
 * Plays a beep sound when the collision occurs
 */
export function pingPongBeep() {
	return (collisionContext: any) => {
		_pingPongBeep();
	};
}

function _pingPongBeep() {
	const frequency = 440;
	const duration = 0.1;
	const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
	const oscillator = audioCtx.createOscillator();
	const gain = audioCtx.createGain();

	oscillator.type = 'square';
	oscillator.frequency.value = frequency;

	gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

	oscillator.connect(gain);
	gain.connect(audioCtx.destination);

	oscillator.start();
	oscillator.stop(audioCtx.currentTime + duration);
} 