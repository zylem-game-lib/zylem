import Stats from 'stats.js';
import { subscribe } from 'valtio/vanilla';
import { debugState } from '../debug/debug-state';

/**
 * GameDebugDelegate handles debug UI for the game (Stats panel).
 * Subscribes to debugState changes for runtime toggle.
 */
export class GameDebugDelegate {
    private statsRef: Stats | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor() {
        this.updateDebugUI();
        this.unsubscribe = subscribe(debugState, () => {
            this.updateDebugUI();
        });
    }

    /**
     * Called every frame - wraps stats.begin()
     */
    begin(): void {
        this.statsRef?.begin();
    }

    /**
     * Called every frame - wraps stats.end()
     */
    end(): void {
        this.statsRef?.end();
    }

    private updateDebugUI(): void {
        if (debugState.enabled && !this.statsRef) {
            // Enable debug UI
            this.statsRef = new Stats();
            this.statsRef.showPanel(0);
            this.statsRef.dom.style.position = 'absolute';
            this.statsRef.dom.style.bottom = '0';
            this.statsRef.dom.style.right = '0';
            this.statsRef.dom.style.top = 'auto';
            this.statsRef.dom.style.left = 'auto';
            document.body.appendChild(this.statsRef.dom);
        } else if (!debugState.enabled && this.statsRef) {
            // Disable debug UI
            if (this.statsRef.dom.parentNode) {
                this.statsRef.dom.parentNode.removeChild(this.statsRef.dom);
            }
            this.statsRef = null;
        }
    }

    dispose(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.statsRef?.dom?.parentNode) {
            this.statsRef.dom.parentNode.removeChild(this.statsRef.dom);
        }
        this.statsRef = null;
    }
}
