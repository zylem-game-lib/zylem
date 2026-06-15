// Shared unit-test setup: provide a minimal 2D canvas context.
//
// The WebGPU particle engine (`Particles` from @zylem/behaviors) builds gradient
// and atlas lookup textures from a 2D canvas in its constructor. Headless DOM
// environments (happy-dom) do not implement a 2D canvas context, so any test
// that constructs a particle system would otherwise throw. This stub returns a
// no-op context sufficient for headless (no-GPU) construction, while preserving
// a real context if the environment happens to provide one.
const proto = (globalThis as any).HTMLCanvasElement?.prototype;

if (proto && !(proto as any).__zylemCanvas2DStubbed) {
	const originalGetContext = proto.getContext;

	proto.getContext = function patchedGetContext(contextType: string, ...rest: unknown[]) {
		if (contextType === '2d') {
			let real: unknown = null;
			try {
				real = originalGetContext ? originalGetContext.call(this, contextType, ...rest) : null;
			} catch {
				real = null;
			}
			if (real) {
				return real;
			}
			return {
				canvas: this,
				fillStyle: '#000000',
				strokeStyle: '#000000',
				globalAlpha: 1,
				createLinearGradient: () => ({ addColorStop: () => {} }),
				createRadialGradient: () => ({ addColorStop: () => {} }),
				fillRect: () => {},
				clearRect: () => {},
				drawImage: () => {},
				getImageData: () => ({ data: new Uint8ClampedArray(4) }),
				putImageData: () => {},
			} as unknown as CanvasRenderingContext2D;
		}
		return originalGetContext ? originalGetContext.call(this, contextType, ...rest) : null;
	};

	(proto as any).__zylemCanvas2DStubbed = true;
}
