export interface Part {
	id: string;
	x: number; y: number; z: number;
	w: number; d: number; h: number;
	move?: 'carriage' | 'shutter' | `punch-${number}`;
}

/** All view-axis components are positive. A separating plane proves painter order. */
export function paintOrder(parts: Part[]): number[] {
	const outgoing = parts.map(() => [] as number[]);
	const incoming = parts.map(() => 0);
	for (let a = 0; a < parts.length; a++) {
		for (let b = a + 1; b < parts.length; b++) {
			const p = parts[a], q = parts[b];
			const behind = p.x + p.w <= q.x + 1e-8 || p.y + p.d <= q.y + 1e-8 || p.z + p.h <= q.z + 1e-8;
			const ahead = q.x + q.w <= p.x + 1e-8 || q.y + q.d <= p.y + 1e-8 || q.z + q.h <= p.z + 1e-8;
			// Opposing separating planes imply disjoint projections, so no edge is needed.
			if (behind === ahead) continue;
			const from = behind ? a : b, to = behind ? b : a;
			outgoing[from].push(to); incoming[to]++;
		}
	}
	const ready = incoming.flatMap((count, index) => count === 0 ? [index] : []);
	const order: number[] = [];
	while (ready.length) {
		const next = ready.shift()!;
		order.push(next);
		for (const to of outgoing[next]) if (--incoming[to] === 0) ready.push(to);
	}
	if (order.length !== parts.length) throw new Error('Interlocked machine parts: split the geometry.');
	return order;
}

export function placeParts(parts: Part[], x: number, station: number, stroke: number, shutter: number): Part[] {
	return parts.map(part => ({ ...part,
		x: part.x + (part.move === 'carriage' ? x : part.move === 'shutter' ? shutter : 0),
		z: part.z - (part.move === `punch-${station}` ? stroke : 0),
	}));
}
