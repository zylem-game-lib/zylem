/**
 * Plays a ricochet sound effect when boundary collision occurs
 */
export function ricochetSound(frequency: number = 800, duration: number = 0.05) {
	_ricochetSound(frequency, duration);
}

function _ricochetSound(frequency: number, duration: number) {
	const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
	const oscillator = audioCtx.createOscillator();
	const gain = audioCtx.createGain();

	oscillator.type = 'sawtooth';
	oscillator.frequency.value = frequency;

	gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

	oscillator.connect(gain);
	gain.connect(audioCtx.destination);

	oscillator.start();
	oscillator.stop(audioCtx.currentTime + duration);
} 