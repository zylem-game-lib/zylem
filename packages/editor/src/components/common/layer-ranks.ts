/**
 * How the editor's own chrome orders itself inside @zylem/ui's `panel` tier.
 *
 * These are rank offsets, not z-indexes: each is added to `--zylem-layer-panel`,
 * so the whole group moves together if the ladder is ever re-cut, and overlays on
 * higher tiers (menus, tooltips, dialogs) stay above all of it by construction.
 * The values are small and well under the 1000-wide band, so no panel can climb
 * into the next tier however many are open.
 */
export const PANEL_RANK = {
	/** The launcher, which a panel is allowed to cover. */
	toggleButton: 1,
	mainPanel: 2,
	/** Detached panels add their index in `panelZOrder`, so clicking raises. */
	detachedBase: 3,
	/**
	 * Dock preview for the main panel. Detached panels derive theirs from their
	 * own rank instead, since they can already be above this.
	 */
	mainDockPreview: 4,
	/**
	 * The ghost that follows the cursor while a section is being torn out. Above
	 * every panel, including the one it came from, but still page furniture, so it
	 * stays below menus and dialogs.
	 */
	dragGhost: 900,
} as const;
