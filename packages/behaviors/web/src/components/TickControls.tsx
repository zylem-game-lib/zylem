import { For, Show } from 'solid-js';
import {
	runAction,
	state,
	tickMany,
	tickOnce,
	useStoreSignal,
} from '../store';

export default function TickControls() {
	const rev = useStoreSignal();

	return (
		<div class="panel">
			<div class="panel-header">
				<span>Tick</span>
				<span class="kbd">
					{(rev(), `tick #${state.tickCount} · t=${state.timeElapsed.toFixed(3)}s`)}
				</span>
			</div>
			<div class="panel-body">
				<div class="field-row">
					<label class="field-label" title="Seconds advanced per Tick. Also the delta auto-applied when an input changes.">
						delta (s)
					</label>
					<input
						class="field-input small"
						type="number"
						step="any"
						min="0"
						value={(rev(), state.delta)}
						onInput={(e) => {
							const n = Number(e.currentTarget.value);
							if (Number.isFinite(n)) state.delta = n;
						}}
					/>
				</div>

				<div class="section-divider" />

				<div class="btn-row">
					<button
						class="btn primary"
						onClick={() => tickOnce()}
						title="Advance one tick using the current input and delta."
					>
						Tick
					</button>
					<button class="btn" onClick={() => tickMany(10)}>
						Tick ×10
					</button>
					<button class="btn" onClick={() => tickMany(100)}>
						Tick ×100
					</button>
				</div>

				<Show when={(rev(), state.currentInstance?.actions?.length ?? 0) > 0}>
					<div class="section-divider" />
					<div class="panel-header" style={{ padding: '0 0 6px', border: 'none' }}>
						<span>Actions</span>
					</div>
					<div class="btn-row">
						<For each={state.currentInstance?.actions ?? []}>
							{(a) => (
								<button class="btn" onClick={() => runAction(a.id)}>
									{a.label}
								</button>
							)}
						</For>
					</div>
				</Show>
			</div>
		</div>
	);
}
