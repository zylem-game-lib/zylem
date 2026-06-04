import { For, Show } from 'solid-js';
import Field from './Field';
import {
	applyConfig,
	getCurrentHarness,
	resetInstance,
	state,
	useStoreSignal,
} from '../store';
import { defaultsFromSchema } from '../harnesses/types';

export default function ConfigForm() {
	const rev = useStoreSignal();

	return (
		<div class="panel">
			<div class="panel-header">
				<span>Config</span>
				<span class="kbd">applied on Apply</span>
			</div>
			<div class="panel-body">
				<Show
					when={(rev(), getCurrentHarness())}
					fallback={<div class="empty">No harness selected.</div>}
				>
					{(h) => (
						<>
							<Show
								when={h().configSchema.length > 0}
								fallback={
									<div class="empty" style={{ padding: '4px 0' }}>
										No config fields.
									</div>
								}
							>
								<For each={[...h().configSchema]}>
									{(field) => (
										<Field
											field={field}
											value={state.config[field.key]}
											onChange={(v) => {
												state.config = { ...state.config, [field.key]: v };
											}}
										/>
									)}
								</For>
							</Show>
							<div class="section-divider" />
							<div class="btn-row">
								<button class="btn primary" onClick={applyConfig}>
									Apply
								</button>
								<button class="btn" onClick={resetInstance}>
									Reset instance
								</button>
								<button
									class="btn"
									onClick={() => {
										state.config = defaultsFromSchema(h().configSchema);
									}}
								>
									Restore defaults
								</button>
							</div>
						</>
					)}
				</Show>
			</div>
		</div>
	);
}
