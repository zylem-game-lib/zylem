import { EntitiesPanelContent } from '../demos/panels';

export function Entities() {
  return (
    <div class="section" id="entities">
      <h2>Entities</h2>
      <h3>.zylem-section + .entity-grid + .entity-grid-item + .entity-icon</h3>
      <div class="demo-container" style={{ width: '500px' }}>
        <EntitiesPanelContent />
      </div>
    </div>
  );
}
