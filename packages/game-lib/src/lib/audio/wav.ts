/**
 * Minimal WAV (RIFF, 16-bit PCM) encoder for rendered audio. Works on any
 * `AudioBuffer`-shaped object so it can run without a Web Audio context.
 */

export interface PcmSource {
	numberOfChannels: number;
	sampleRate: number;
	length: number;
	getChannelData(channel: number): Float32Array;
}

export function encodeWav(buffer: PcmSource): ArrayBuffer {
	const channels = Math.max(1, buffer.numberOfChannels);
	const frames = buffer.length;
	const bytesPerSample = 2;
	const blockAlign = channels * bytesPerSample;
	const dataSize = frames * blockAlign;
	const out = new ArrayBuffer(44 + dataSize);
	const view = new DataView(out);

	writeAscii(view, 0, 'RIFF');
	view.setUint32(4, 36 + dataSize, true);
	writeAscii(view, 8, 'WAVE');
	writeAscii(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, channels, true);
	view.setUint32(24, buffer.sampleRate, true);
	view.setUint32(28, buffer.sampleRate * blockAlign, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bytesPerSample * 8, true);
	writeAscii(view, 36, 'data');
	view.setUint32(40, dataSize, true);

	const data: Float32Array[] = [];
	for (let channel = 0; channel < channels; channel += 1) {
		data.push(buffer.getChannelData(Math.min(channel, buffer.numberOfChannels - 1)));
	}
	let offset = 44;
	for (let frame = 0; frame < frames; frame += 1) {
		for (let channel = 0; channel < channels; channel += 1) {
			const sample = Math.max(-1, Math.min(1, data[channel]?.[frame] ?? 0));
			view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
			offset += bytesPerSample;
		}
	}
	return out;
}

/** `encodeWav` as a `Blob` ready for upload or download. */
export function encodeWavBlob(buffer: PcmSource): Blob {
	return new Blob([encodeWav(buffer)], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, text: string) {
	for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}
