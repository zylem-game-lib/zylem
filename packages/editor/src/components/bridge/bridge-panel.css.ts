/**
 * Local styles for the Bridge debug panel.
 * Injected alongside @zylem/ui styles in the editor web component.
 */
export const bridgePanelCSS = `
.bridge-row--hot .zylem-property-label,
.bridge-row--hot .zylem-property-value {
	color: #ffb347;
	font-weight: 600;
}

.bridge-log {
	display: flex;
	flex-direction: column;
	gap: 2px;
	max-height: 220px;
	font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
	font-size: 11px;
	line-height: 1.4;
}

.bridge-log-row {
	display: grid;
	grid-template-columns: 52px minmax(96px, auto) 60px 1fr;
	gap: 8px;
	align-items: baseline;
	padding: 2px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	white-space: nowrap;
}

.bridge-log-kind {
	text-transform: uppercase;
	font-size: 9px;
	letter-spacing: 0.04em;
	opacity: 0.85;
}

.bridge-log-kind--send {
	color: #7ee787;
}

.bridge-log-kind--flush {
	color: #79c0ff;
}

.bridge-log-kind--queue {
	color: #d2a8ff;
}

.bridge-log-type {
	overflow: hidden;
	text-overflow: ellipsis;
}

.bridge-log-meta {
	opacity: 0.6;
	text-align: right;
}

.bridge-log-summary {
	overflow: hidden;
	text-overflow: ellipsis;
	opacity: 0.75;
}
`;
