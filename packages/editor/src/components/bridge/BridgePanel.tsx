import { Button } from '@zylem/ui/components';
import { For, Show, createSignal, onCleanup, onMount, type Component } from 'solid-js';
import { subscribe } from 'valtio/vanilla';
import {
	BRIDGE_RATE_WARNING,
	bridgePanelState,
	clearBridgeLog,
	formatBytes,
	setBridgeCapturePaused,
	startBridgeCapture,
	stopBridgeCapture,
	type BridgeLogEntry,
	type BridgeStatsRow,
} from './bridge-panel-state';

/**
 * Live view of editor ↔ game bridge traffic: per-type rates and volumes on
 * top, a rolling message log below. Capture starts when the panel mounts and
 * stops when it unmounts, so the tracer only runs while someone is watching.
 */
export const BridgePanel: Component = () => {
	const [stats, setStats] = createSignal<BridgeStatsRow[]>([]);
	const [entries, setEntries] = createSignal<BridgeLogEntry[]>([]);
	const [paused, setPaused] = createSignal(bridgePanelState.paused);
	const [dropped, setDropped] = createSignal(0);

	onMount(() => {
		startBridgeCapture();
		const unsubscribe = subscribe(bridgePanelState, () => {
			setStats([...bridgePanelState.stats]);
			setEntries([...bridgePanelState.entries]);
			setPaused(bridgePanelState.paused);
			setDropped(bridgePanelState.dropped);
		});
		onCleanup(() => {
			unsubscribe();
			stopBridgeCapture();
		});
	});

	const togglePaused = () => setBridgeCapturePaused(!bridgePanelState.paused);

	const totalRate = () =>
		stats().reduce((sum, row) => sum + row.rate, 0);

	return (
		<div class="panel-content">
			<section class="zylem-toolbar">
				<Button size="sm" onClick={togglePaused}>
					{paused() ? 'Resume' : 'Pause'}
				</Button>
				<Button size="sm" onClick={clearBridgeLog}>
					Clear
				</Button>
				<span class="zylem-property-value">
					{totalRate().toFixed(0)} msg/s
				</span>
			</section>

			<Show
				when={stats().length > 0}
				fallback={
					<p class="zylem-property-value">
						No bridge traffic recorded yet.
					</p>
				}
			>
				<section class="zylem-section">
					<h4 class="zylem-section-title">Message types</h4>
					<div class="zylem-property-list">
						<For each={stats()}>
							{(row) => (
								<div
									class="zylem-property-row"
									classList={{ 'bridge-row--hot': row.rate > BRIDGE_RATE_WARNING }}
									title={
										`sent ${row.sent} · queued ${row.queued} · `
										+ `delivered ${row.delivered} · `
										+ `coalesced ${(row.coalesced * 100).toFixed(0)}% · `
										+ `${row.listeners} listener(s) · `
										+ `${row.retained} retained`
									}
								>
									<span class="zylem-property-label">{row.type}</span>
									<span class="zylem-property-value">
										{row.sent} · {row.rate.toFixed(0)}/s · {formatBytes(row.bytes)}
										{row.retained > 0 ? ` · ${row.retained} kept` : ''}
									</span>
								</div>
							)}
						</For>
					</div>
				</section>
			</Show>

			<section class="zylem-section">
				<h4 class="zylem-section-title">
					Recent messages
					<Show when={dropped() > 0}>
						{' '}
						<span class="zylem-property-value">({dropped()} older dropped)</span>
					</Show>
				</h4>
				<div class="bridge-log scrollable-y scroll-thin">
					<For
						each={entries().slice().reverse()}
						fallback={<p class="zylem-property-value">Waiting for messages…</p>}
					>
						{(entry) => (
							<div class="bridge-log-row">
								<span class={`bridge-log-kind bridge-log-kind--${entry.kind}`}>
									{entry.kind}
								</span>
								<span class="bridge-log-type">{entry.type}</span>
								<span class="bridge-log-meta">{formatBytes(entry.bytes)}</span>
								<span class="bridge-log-summary">{entry.summary}</span>
							</div>
						)}
					</For>
				</div>
			</section>
		</div>
	);
};
