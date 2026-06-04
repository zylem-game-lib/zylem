import { Show } from 'solid-js';
import Sidebar from './components/Sidebar';
import ConfigForm from './components/ConfigForm';
import InputForm from './components/InputForm';
import TickControls from './components/TickControls';
import Snapshot from './components/Snapshot';
import { getCurrentHarness, useStoreSignal } from './store';

export default function App() {
	const rev = useStoreSignal();

	return (
		<div class="app">
			<Sidebar />

			<main class="main">
				<Show
					when={(rev(), getCurrentHarness())}
					fallback={
						<div class="empty-state">
							<p>No behavior selected.</p>
						</div>
					}
				>
					{(h) => (
						<>
							<div class="main-header">
								<div class="main-title">{h().name}</div>
								<div class="main-id">
									{h().id}
									{h().subtitle ? ` · ${h().subtitle}` : ''}
								</div>
							</div>
							<Show when={h().description}>
								<p class="main-desc">{h().description}</p>
							</Show>

							<TickControls />
							<ConfigForm />
							<InputForm />
						</>
					)}
				</Show>
			</main>

			<Snapshot />
		</div>
	);
}
