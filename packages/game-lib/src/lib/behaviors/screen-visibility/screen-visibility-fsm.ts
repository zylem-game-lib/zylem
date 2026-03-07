export interface ScreenVisibilitySnapshot {
	initialized: boolean;
	visible: boolean;
	justEntered: boolean;
	justExited: boolean;
	visibleCameraNames: string[];
}

export class ScreenVisibilityFSM {
	private initialized = false;
	private visible = false;
	private justEntered = false;
	private justExited = false;
	private visibleCameraNames: string[] = [];

	update(visible: boolean, visibleCameraNames: readonly string[]): void {
		const wasVisible = this.visible;

		this.justEntered = !wasVisible && visible;
		this.justExited = wasVisible && !visible;

		if (!this.initialized) {
			this.justEntered = visible;
			this.justExited = false;
		}

		this.initialized = true;
		this.visible = visible;
		this.visibleCameraNames = [...visibleCameraNames];
	}

	isInitialized(): boolean {
		return this.initialized;
	}

	isVisible(): boolean {
		return this.visible;
	}

	wasJustEntered(): boolean {
		return this.justEntered;
	}

	wasJustExited(): boolean {
		return this.justExited;
	}

	getVisibleCameraNames(): string[] {
		return [...this.visibleCameraNames];
	}

	getState(): ScreenVisibilitySnapshot {
		return {
			initialized: this.initialized,
			visible: this.visible,
			justEntered: this.justEntered,
			justExited: this.justExited,
			visibleCameraNames: this.getVisibleCameraNames(),
		};
	}
}
