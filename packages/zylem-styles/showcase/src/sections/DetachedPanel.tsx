import X from 'lucide-solid/icons/x';
import { StagePanelContent } from '../demos/panels';

/**
 * Static replica of the editor's DetachedPanel (an accordion section dragged
 * out into its own floating window), plus the drag-to-detach visuals.
 */
export function DetachedPanel() {
  return (
    <div class="section" id="detached-panel">
      <h2>Detached Panel</h2>
      <h3>.detached-panel + .detached-panel-titlebar / -content</h3>
      <div class="demo-row">
        <div
          class="detached-panel floating-panel"
          style={{ position: 'relative', width: '350px', height: '260px' }}
        >
          <div
            class="detached-panel-titlebar floating-panel-titlebar"
            style={{ 'border-radius': '12px 12px 0 0' }}
          >
            <span class="floating-panel-title">Stage</span>
            <button class="floating-panel-button zylem-button" title="Reattach panel" type="button">
              <X size={12} />
            </button>
          </div>
          <div class="detached-panel-content floating-panel-content">
            <StagePanelContent />
          </div>
        </div>
      </div>

      <h3>.accordion-drag-ghost + .accordion-drop-indicator (drag-to-detach visuals)</h3>
      <div class="demo-container" style={{ width: '400px' }}>
        <div
          class="accordion-drag-ghost"
          style={{ position: 'static', width: '300px', height: '42px' }}
        >
          <span class="accordion-trigger zylem-exo-2" style={{ padding: '8px 12px' }}>
            Console
          </span>
        </div>
        <div class="accordion-drop-indicator" style={{ width: '300px' }} />
      </div>
    </div>
  );
}
