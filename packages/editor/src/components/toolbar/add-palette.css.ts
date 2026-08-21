/**
 * Local styles for the toolbar and the transform inspector.
 * Injected alongside @zylem/ui styles in the editor web component.
 *
 * The Add tool's split button and palette are `MenuButton` and `ItemPicker` from
 * @zylem/ui now, so only the glyph sizing for game-supplied icons is left here.
 */
export const addPaletteCSS = `
/*
 * The toolbar carries three tool groups now, which overflows a narrow docked
 * panel; wrapping keeps every button reachable instead of clipping the tail.
 */
.zylem-toolbar {
	flex-wrap: wrap;
}

.zylem-toolbar-divider {
	width: 1px;
	align-self: stretch;
	margin: 0 2px;
	background: rgba(255, 255, 255, 0.18);
}

/* Keeps a group's buttons together when the toolbar wraps. */
.zylem-toolbar-group {
	display: inline-flex;
	align-items: center;
	gap: inherit;
}

/* Keeps the gizmo buttons together when the toolbar wraps. */
.zylem-toolbar-transforms {
	display: inline-flex;
	align-items: center;
	gap: inherit;
}

.zylem-add-tool {
	display: inline-flex;
	align-items: stretch;
}

/* Sizes the inline SVG the game's catalog supplies for the armed type. */
.zylem-add-tool__glyph {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: currentColor;
}

.zylem-add-tool__glyph svg {
	width: 18px;
	height: 18px;
}

/* ── Transform inspector ─────────────────────────────────────────────────── */

.zylem-transform-row {
	display: grid;
	grid-template-columns: 54px repeat(3, minmax(0, 1fr));
	gap: 5px;
	align-items: center;
	margin-bottom: 5px;
}

.zylem-transform-row__label {
	font-size: 10px;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	opacity: 0.65;
}

.zylem-transform-row__field {
	width: 100%;
	min-width: 0;
	padding: 3px 5px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	font-size: 11px;
	color: #e6edf3;
	background: rgba(255, 255, 255, 0.06);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 4px;
}

.zylem-transform-row__field:focus {
	outline: none;
	border-color: rgba(120, 180, 255, 0.55);
}

.zylem-transform-empty {
	margin: 0;
	padding: 6px 0;
	font-size: 11px;
	opacity: 0.6;
}

.zylem-transform-snap {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	align-items: center;
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid rgba(255, 255, 255, 0.08);
	font-size: 11px;
}

.zylem-transform-snap label {
	display: inline-flex;
	gap: 5px;
	align-items: center;
	cursor: pointer;
}

.zylem-transform-hint {
	margin: 6px 0 0;
	font-size: 10px;
	line-height: 1.4;
	opacity: 0.5;
}
`;
