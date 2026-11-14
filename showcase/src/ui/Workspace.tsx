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
import {
	EmptyState,
	Kbd,
	Panel,
	Sidebar as UISidebar,
	sidebarItemClass,
} from '@zylem/ui/components';
import type { ShowcaseDemo } from '../demo-types';
import { type DemoConfig, demoSections, getDemoByRoutePath } from '../showcase-config';

/** `Z: next stage` draws `Z` as a key cap; a line without a colon is plain text. */
const ControlHint: Component<{ line: string }> = (props) => {
	const parts = createMemo(() => {
		const split = props.line.indexOf(': ');
		return split === -1
			? { input: null, action: props.line }
			: { input: props.line.slice(0, split), action: props.line.slice(split + 2) };
	});
	return (
		<li class="info-control">
			<Show when={parts().input}>{(input) => <Kbd>{input()}</Kbd>}</Show>
			<span>{parts().action}</span>
		</li>
	);
};

/** What the open exhibit shows and how to drive it, pinned to the sidebar's foot. */
const InfoPanel: Component<{ demo: ShowcaseDemo; title: string }> = (props) => {
	return (
		<Panel class="info-panel" title={props.title}>
			<Show when={props.demo.description}>
				<p class="info-description">{props.demo.description}</p>
			</Show>
			<Show when={props.demo.controls?.length}>
				<ul class="info-controls">
					<For each={props.demo.controls}>{(line) => <ControlHint line={line} />}</For>
				</ul>
			</Show>
		</Panel>
	);
};

const Sidebar: Component<{
	activeId: string | null;
	activeName: string;
	demo: ShowcaseDemo | null;
}> = (props) => {
	return (
		<UISidebar class="showcase-sidebar">
			<A href="/" class="sidebar-title">
				<span class="sidebar-title-main">Zylem</span> Showcase
			</A>
			<For each={demoSections}>
				{(section) => (
					<Show when={section.demos.length > 0}>
						<UISidebar.Section title={section.name}>
							<For each={section.demos}>
								{(demo) => (
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
			<Show when={props.demo}>
				{(demo) => <InfoPanel demo={demo()} title={props.activeName} />}
			</Show>
		</UISidebar>
	);
};

const Landing: Component = () => (
	<EmptyState class="viewer-status" title="Zylem Showcase">
		<p>
			One exhibit per <code>@zylem/game-lib</code> feature, running on this checkout's build.
		</p>
		<p>Select an exhibit from the sidebar.</p>
	</EmptyState>
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
				.then((mod) => {
					if (cancelled) return;
					setDemo(mod.default());
				})
				.catch((error) => {
					if (cancelled) return;
					console.error(`Failed to load exhibit "${config.id}"`, error);
					setLoadError(String(error));
				});
			onCleanup(() => {
				cancelled = true;
			});
		}),
	);

	return (
		<div class="app-shell zylem-hyperglass-root">
			<Sidebar
				activeId={activeConfig()?.id ?? null}
				activeName={activeConfig()?.name ?? ''}
				demo={demo()}
			/>
			<main class="viewer">
				<Show when={activeConfig()} fallback={<Landing />}>
					<Show
						when={demo()}
						fallback={
							<EmptyState
								class="viewer-status"
								title={loadError() ? 'Failed to load exhibit' : 'Loading…'}
							>
								<Show when={loadError()}>
									<p>{loadError()}</p>
								</Show>
							</EmptyState>
						}
					>
						{(d) => <zylem-game class="game-canvas" game={d().game} />}
					</Show>
				</Show>
			</main>
		</div>
	);
};

export default Workspace;
