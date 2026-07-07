import PanelBottomClose from 'lucide-solid/icons/panel-bottom-close';
import X from 'lucide-solid/icons/x';
import { GamePanelContent } from '../demos/panels';

/** Static replica of the editor's FloatingPanel (rendered in-flow instead of fixed). */
export function FloatingPanel() {
  return (
    <div class="section" id="floating-panel">
      <h2>Floating Panel</h2>
      <h3>.floating-panel + .floating-panel-titlebar / -title / -controls / -button / -content</h3>
      <div class="floating-panel" style={{ width: '400px', display: 'flex', 'flex-direction': 'column' }}>
        <div
          class="floating-panel-titlebar"
          style={{
            cursor: 'grab',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'space-between',
            'user-select': 'none',
          }}
        >
          <span class="floating-panel-title">Zylem Editor</span>
          <div class="floating-panel-controls">
            <button class="floating-panel-button" title="Collapse panel" type="button">
              <PanelBottomClose size={12} />
            </button>
            <button class="floating-panel-button" title="Close panel" type="button">
              <X size={12} />
            </button>
          </div>
        </div>
        <div
          class="floating-panel-content"
          style={{ flex: '1', overflow: 'hidden', display: 'flex', 'flex-direction': 'column' }}
        >
          <GamePanelContent />
        </div>
      </div>
    </div>
  );
}
