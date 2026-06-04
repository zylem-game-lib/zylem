import { For } from 'solid-js';
import { registry, runtimeRequired } from '../harnesses/registry';
import { state, selectHarness, useStoreSignal } from '../store';

export default function Sidebar() {
	const rev = useStoreSignal();

	return (
		<aside class="sidebar">
			<div class="sidebar-title">Behaviors</div>

			<div class="sidebar-group">
				<div class="sidebar-group-label">FSM</div>
				<For each={registry.filter((h) => h.category === 'fsm')}>
					{(h) => {
						const isActive = () => (rev(), state.selectedId === h.id);
						return (
							<div
								class="sidebar-item"
								classList={{ active: isActive() }}
								onClick={() => selectHarness(h.id)}
							>
								<span>{h.id}</span>
							</div>
						);
					}}
				</For>
			</div>

			<div class="sidebar-group">
				<div class="sidebar-group-label">Store</div>
				<For each={registry.filter((h) => h.category === 'store')}>
					{(h) => {
						const isActive = () => (rev(), state.selectedId === h.id);
						return (
							<div
								class="sidebar-item"
								classList={{ active: isActive() }}
								onClick={() => selectHarness(h.id)}
							>
								<span>{h.id}</span>
							</div>
						);
					}}
				</For>
			</div>

			<div class="sidebar-group">
				<div class="sidebar-group-label">Runtime-required (not wired)</div>
				<For each={runtimeRequired}>
					{(b) => (
						<div class="sidebar-item disabled" title="Requires Rapier / wasm stage / live entity">
							<span>{b.id}</span>
							<span class="tag">soon</span>
						</div>
					)}
				</For>
			</div>
		</aside>
	);
}
