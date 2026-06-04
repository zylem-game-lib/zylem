import { For, Show, createMemo } from 'solid-js';
import { state, useStoreSignal } from '../store';

function safeStringify(value: unknown): string {
	const seen = new WeakSet();
	return JSON.stringify(
		value,
		(_k, v) => {
			if (typeof v === 'function') return `[fn ${v.name || 'anonymous'}]`;
			if (typeof v === 'symbol') return v.toString();
			if (typeof v === 'object' && v !== null) {
				if (seen.has(v as object)) return '[circular]';
				seen.add(v as object);
			}
			return v;
		},
		2,
	);
}

export default function Snapshot() {
	const rev = useStoreSignal();

	const snap = createMemo(() => {
		rev();
		try {
			return state.currentInstance?.snapshot() ?? null;
		} catch (e) {
			return { error: String(e) };
		}
	});

	const fsmState = createMemo(() => {
		const s = snap() as Record<string, unknown> | null;
		if (s && typeof s['state'] === 'string') return s['state'];
		return null;
	});

	const json = createMemo(() => safeStringify(snap()));

	const historyView = createMemo(() => {
		rev();
		return [...state.history].slice().reverse().slice(0, 30);
	});

	return (
		<aside class="snapshot">
			<Show when={fsmState() !== null}>
				<div class="snapshot-state">
					<div class="snapshot-state-label">State</div>
					<div class="snapshot-state-value">{fsmState()}</div>
				</div>
			</Show>

			<div class="panel" style={{ margin: '14px', 'border-radius': '6px' }}>
				<div class="panel-header">
					<span>Snapshot</span>
					<span class="kbd">{(rev(), `rev ${state.snapshotRevision}`)}</span>
				</div>
				<pre class="snapshot-json">{json()}</pre>
			</div>

			<div class="panel" style={{ margin: '14px', 'border-radius': '6px' }}>
				<div class="panel-header">
					<span>History</span>
					<span class="kbd">
						<label class="checkbox-row">
							<input
								type="checkbox"
								checked={(rev(), state.historyEnabled)}
								onChange={(e) =>
									(state.historyEnabled = e.currentTarget.checked)
								}
							/>
							record
						</label>
					</span>
				</div>
				<Show
					when={(rev(), state.history.length > 0)}
					fallback={<div class="empty">No ticks recorded yet.</div>}
				>
					<div style={{ 'max-height': '320px', 'overflow-y': 'auto' }}>
						<table class="history-table">
							<thead>
								<tr>
									<th>#</th>
									<th>t</th>
									<th>dt</th>
									<th>state</th>
								</tr>
							</thead>
							<tbody>
								<For each={historyView()}>
									{(e) => (
										<tr>
											<td>{e.tick}</td>
											<td>{e.time.toFixed(3)}</td>
											<td>{e.delta.toFixed(3)}</td>
											<td>{e.state ?? '—'}</td>
										</tr>
									)}
								</For>
							</tbody>
						</table>
					</div>
				</Show>
			</div>
		</aside>
	);
}
