export interface Entity {
	setup: () => void;
	destroy: () => void;
	update: (delta: number) => void;
}