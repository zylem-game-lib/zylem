/**
 * Local styles for entity list thumbnails and AABB dimension rulers.
 * Injected alongside @zylem/ui styles in the editor web component.
 */
export const entityPreviewCSS = `
.entity-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
	gap: 8px;
	padding: 4px 0;
}

.entity-grid-item {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 4px;
	padding: 6px;
	margin: 0;
	border: 1px solid color-mix(in srgb, var(--zylem-color-border, #444) 80%, transparent);
	border-radius: 6px;
	background: color-mix(in srgb, var(--zylem-color-surface, #2a2a2a) 90%, transparent);
	color: inherit;
	cursor: pointer;
	text-align: left;
}

.entity-grid-item:hover {
	border-color: var(--zylem-color-accent, #6ea8fe);
}

.entity-grid-item:focus-visible {
	outline: 2px solid var(--zylem-color-accent, #6ea8fe);
	outline-offset: 1px;
}

.entity-grid-name {
	display: block;
	font-size: 11px;
	line-height: 1.2;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	opacity: 0.85;
}

.entity-thumbnail {
	width: 100%;
}

.entity-thumbnail-frame {
	position: relative;
	width: 100%;
	aspect-ratio: 1;
	overflow: hidden;
	border-radius: 4px;
	background: #3a3a3a;
	display: flex;
	align-items: center;
	justify-content: center;
}

.entity-thumbnail-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
	pointer-events: none;
}

.entity-thumbnail-frame .entity-icon {
	width: 40%;
	height: 40%;
	opacity: 0.75;
}

.entity-ruler {
	position: absolute;
	pointer-events: none;
	color: rgba(255, 255, 255, 0.9);
	font-size: 9px;
	line-height: 1;
	font-variant-numeric: tabular-nums;
}

.entity-ruler-bottom {
	left: 10px;
	right: 4px;
	bottom: 2px;
	height: 12px;
	display: flex;
	align-items: flex-end;
	justify-content: center;
}

.entity-ruler-side {
	top: 4px;
	bottom: 14px;
	left: 1px;
	width: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.entity-ruler-ticks {
	position: absolute;
	inset: 0;
	border: 0 solid rgba(255, 255, 255, 0.55);
	pointer-events: none;
}

.entity-ruler-bottom .entity-ruler-ticks {
	border-top-width: 1px;
	border-left-width: 1px;
	border-right-width: 1px;
	height: 4px;
	bottom: 0;
	top: auto;
	background-image: repeating-linear-gradient(
		to right,
		rgba(255, 255, 255, 0.55) 0,
		rgba(255, 255, 255, 0.55) 1px,
		transparent 1px,
		transparent 6px
	);
	background-size: 6px 3px;
	background-repeat: repeat-x;
	background-position: top left;
}

.entity-ruler-side .entity-ruler-ticks {
	border-right-width: 1px;
	border-top-width: 1px;
	border-bottom-width: 1px;
	width: 4px;
	left: 0;
	right: auto;
	background-image: repeating-linear-gradient(
		to bottom,
		rgba(255, 255, 255, 0.55) 0,
		rgba(255, 255, 255, 0.55) 1px,
		transparent 1px,
		transparent 6px
	);
	background-size: 3px 6px;
	background-repeat: repeat-y;
	background-position: top right;
}

.entity-ruler-label {
	position: relative;
	z-index: 1;
	padding: 0 2px;
	background: rgba(0, 0, 0, 0.45);
	border-radius: 2px;
}

.entity-ruler-side .entity-ruler-label {
	writing-mode: vertical-rl;
	transform: rotate(180deg);
}

.entity-ruler-depth {
	position: absolute;
	top: 2px;
	right: 3px;
	font-size: 9px;
	line-height: 1;
	padding: 1px 3px;
	border-radius: 2px;
	background: rgba(0, 0, 0, 0.45);
	color: rgba(255, 255, 255, 0.85);
	font-variant-numeric: tabular-nums;
}
`;
