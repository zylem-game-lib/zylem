import { Component, For, Show, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { ExampleConfig } from '../../examples-config';
import DemoViewer from '../DemoViewer/DemoViewer';
import DemoPreviewImage from '../DemoPreviewImage/DemoPreviewImage';
import { getZylemEditorElement } from '../../editor-host';
import {
	appStore,
	getFilteredExampleSections,
	setMobileDemoDrawerOpen,
	setSearchTerm,
	toggleMobileDemoDrawer,
} from '../../store/appStore';
import styles from './MobileWorkspace.module.css';

const DemoButtonIcon: Component = () => (
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
		<rect
			x="3.5"
			y="4"
			width="7"
			height="7"
			rx="1.8"
			stroke="currentColor"
			stroke-width="1.7"
		/>
		<rect
			x="13.5"
			y="4"
			width="7"
			height="7"
			rx="1.8"
			stroke="currentColor"
			stroke-width="1.7"
		/>
		<rect
			x="3.5"
			y="14"
			width="7"
			height="7"
			rx="1.8"
			stroke="currentColor"
			stroke-width="1.7"
		/>
		<path
			d="M16 15.5V19.5"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
		/>
		<path
			d="M14 17.5H18"
			stroke="currentColor"
			stroke-width="1.7"
			stroke-linecap="round"
		/>
	</svg>
);

const MobileWorkspace: Component = () => {
	const navigate = useNavigate();
	const filteredSections = createMemo(() => getFilteredExampleSections());
	const activeExampleName = () => appStore.activeExample?.name ?? 'Browse demos';

	const handleStageInteract = () => {
		if (appStore.mobileDemoDrawerOpen) {
			setMobileDemoDrawerOpen(false);
		}
	};

	const handleExampleSelect = (example: ExampleConfig) => {
		if (appStore.activeExample?.id === example.id) {
			setMobileDemoDrawerOpen(false);
			return;
		}

		setMobileDemoDrawerOpen(false);
		navigate(example.routePath);
	};

	const handleEditorToggle = () => {
		getZylemEditorElement()?.togglePanel();
	};

	return (
		<div class={styles.shell} data-mobile-shell>
			<div class={styles.viewerLayer}>
				<DemoViewer
					layout="mobile"
					interceptStageInteractions={appStore.mobileDemoDrawerOpen}
					onStageInteract={handleStageInteract}
				/>
			</div>

			<section
				id="mobile-demo-drawer"
				class={`${styles.drawer} ${appStore.mobileDemoDrawerOpen ? styles.drawerOpen : ''}`}
				data-mobile-demo-drawer
				data-state={appStore.mobileDemoDrawerOpen ? 'open' : 'closed'}
				aria-hidden={!appStore.mobileDemoDrawerOpen}
			>
				<div class={styles.drawerHandle} />
				<div class={styles.drawerScrollArea}>
					<Show
						when={filteredSections().length > 0}
						fallback={
							<div class={styles.emptyState}>
								No demos match "{appStore.searchTerm.trim()}".
							</div>
						}
					>
						<For each={filteredSections()}>
							{(section) => (
								<section class={styles.section}>
									<div class={styles.sectionHeader}>
										<h2 class={styles.sectionTitle}>{section.name}</h2>
										<span class={styles.sectionCount}>
											{section.examples.length}
										</span>
									</div>
									<div class={styles.sectionGrid}>
										<For each={section.examples}>
											{(example) => (
												<button
													type="button"
													class={`${styles.demoCard} ${appStore.activeExample?.id === example.id ? styles.demoCardActive : ''}`}
													data-mobile-demo-card={example.id}
													onClick={() => handleExampleSelect(example)}
													aria-label={example.name}
												>
													<DemoPreviewImage
														exampleId={example.id}
														name={example.name}
														isActive={appStore.activeExample?.id === example.id}
														variant="compact"
													/>
												</button>
											)}
										</For>
									</div>
								</section>
							)}
						</For>
					</Show>
				</div>
				<div class={styles.searchDock}>
					<input
						type="text"
						placeholder="Search demos..."
						class={styles.searchInput}
						value={appStore.searchTerm}
						data-mobile-demo-search
						onInput={(event) => setSearchTerm(event.currentTarget.value)}
					/>
				</div>
			</section>

			<div class={styles.bottomBar}>
				<button
					type="button"
					class={`${styles.bottomButton} ${appStore.mobileDemoDrawerOpen ? styles.bottomButtonActive : ''}`}
					data-mobile-demo-button
					onClick={() => toggleMobileDemoDrawer()}
					aria-label={
						appStore.mobileDemoDrawerOpen ? 'Close demo drawer' : 'Open demo drawer'
					}
					aria-controls="mobile-demo-drawer"
					aria-expanded={appStore.mobileDemoDrawerOpen}
				>
					<DemoButtonIcon />
				</button>

				<div class={styles.bottomBarLabel}>
					<div class={styles.bottomBarCaption}>Current demo</div>
					<div class={styles.bottomBarTitle}>{activeExampleName()}</div>
				</div>

				<button
					type="button"
					class={`${styles.bottomButton} ${styles.editorButton}`}
					data-mobile-editor-button
					onClick={handleEditorToggle}
					aria-label="Toggle Zylem editor"
				/>
			</div>
		</div>
	);
};

export default MobileWorkspace;
