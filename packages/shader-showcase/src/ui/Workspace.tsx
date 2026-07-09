import { A, useLocation } from '@solidjs/router';
import {
	type Component,
	For,
	Show,
	createEffect,
	createMemo,
	createSignal,
	on,
	onCleanup,
} from 'solid-js';
import { Sidebar as UISidebar, sidebarItemClass } from '@zylem/ui/components';
import type { ShowcaseDemo } from '../demo-types';
import { type DemoConfig, demoSections, getDemoByRoutePath } from '../showcase-config';
import ControlsPanel from './ControlsPanel';

const Sidebar: Component<{ activeId: string | null }> = props => {
	return (
		<UISidebar class="showcase-sidebar">
			<A href="/" class="sidebar-title">
				<span class="sidebar-title-main">Zylem</span> Shader Showcase
			</A>
			<For each={demoSections}>
				{section => (
					<Show when={section.demos.length > 0}>
						<UISidebar.Section title={section.name}>
							<For each={section.demos}>
								{demo => (
									<A
										href={demo.routePath}
										class={sidebarItemClass}
										classList={{ 'is-active': props.activeId === demo.id }}
									>
										{demo.name}
									</A>
								)}
							</For>
						</UISidebar.Section>
					</Show>
				)}
			</For>
		</UISidebar>
	);
};

const Landing: Component = () => (
	<div class="landing">
		<h1>Zylem Shader Showcase</h1>
		<p>
			Demos for <code>@zylem/shaders</code> — WebGPU TSL shaders and postprocessing
			effects consumed through <code>@zylem/game-lib</code>.
		</p>
		<p>Select a demo from the sidebar.</p>
	</div>
);

const Workspace: Component = () => {
	const location = useLocation();
	const activeConfig = createMemo(() => getDemoByRoutePath(location.pathname));
	const [demo, setDemo] = createSignal<ShowcaseDemo | null>(null);
	const [loadError, setLoadError] = createSignal<string | null>(null);

	createEffect(
		on(activeConfig, (config: DemoConfig | null) => {
			setDemo(null);
			setLoadError(null);
			if (!config) return;
			let cancelled = false;
			config
				.load()
				.then(mod => {
					if (cancelled) return;
					setDemo(mod.default());
				})
				.catch(error => {
					if (cancelled) return;
					console.error(`Failed to load demo "${config.id}"`, error);
					setLoadError(String(error));
				});
			onCleanup(() => {
				cancelled = true;
			});
		}),
	);

	return (
		<div class="app-shell zylem-hyperglass-root">
			<Sidebar activeId={activeConfig()?.id ?? null} />
			<main class="viewer">
				<Show when={activeConfig()} fallback={<Landing />}>
					<Show
						when={demo()}
						fallback={
							<div class="viewer-status">
								{loadError() ? `Failed to load demo: ${loadError()}` : 'Loading…'}
							</div>
						}
					>
						{d => (
							<>
								<zylem-game class="game-canvas" game={d().game} />
								<ControlsPanel demo={d()} title={activeConfig()?.name ?? ''} />
							</>
						)}
					</Show>
				</Show>
			</main>
		</div>
	);
};

export default Workspace;
