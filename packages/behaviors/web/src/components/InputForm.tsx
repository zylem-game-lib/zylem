import { For, Show } from 'solid-js';
import Field from './Field';
import {
	getCurrentHarness,
	setInput,
	setInputField,
	state,
	useStoreSignal,
} from '../store';
import { defaultsFromSchema } from '../harnesses/types';

export default function InputForm() {
	const rev = useStoreSignal();

	return (
		<div class="panel">
			<div class="panel-header">
				<span>Per-tick input</span>
				<span class="kbd">edits auto-tick</span>
			</div>
			<div class="panel-body">
				<Show
					when={(rev(), getCurrentHarness())}
					fallback={<div class="empty">No harness selected.</div>}
				>
					{(h) => (
						<>
							<Show
								when={h().inputSchema.length > 0}
								fallback={
									<div class="empty" style={{ padding: '4px 0' }}>
										This behavior takes no per-tick input — use the Tick
										button to advance time.
									</div>
								}
							>
								<For each={[...h().inputSchema]}>
									{(field) => (
										<Field
											field={field}
											value={state.input[field.key]}
											onChange={(v) => setInputField(field.key, v)}
										/>
									)}
								</For>
							</Show>
							<Show when={h().inputSchema.length > 0}>
								<div class="section-divider" />
								<div class="btn-row">
									<button
										class="btn"
										onClick={() => setInput(defaultsFromSchema(h().inputSchema))}
									>
										Reset input
									</button>
								</div>
							</Show>
						</>
					)}
				</Show>
			</div>
		</div>
	);
}
