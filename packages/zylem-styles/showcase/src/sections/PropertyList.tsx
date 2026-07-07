import { createSignal } from 'solid-js';

const FULL_PATH = '/assets/textures/backgrounds/space-nebula.png';
const TRUNCATED_PATH = '.../textures/backgrounds/space-nebula.png';

export function PropertyList() {
  const [expanded, setExpanded] = createSignal(false);

  return (
    <div class="section" id="property-list">
      <h2>Property List</h2>
      <h3>.zylem-property-list + .zylem-property-row (PropertyRow pattern)</h3>
      <div class="demo-container" style={{ width: '400px' }}>
        <section class="zylem-property-list">
          <div class="zylem-property-row">
            <span class="zylem-property-label">ID</span>
            <span class="zylem-property-value">demo-game</span>
          </div>
          <div class="zylem-property-row">
            <span class="zylem-property-label">Aspect Ratio</span>
            <span class="zylem-property-value">1.778</span>
          </div>
          <div class="zylem-property-row">
            <span class="zylem-property-label">Gravity</span>
            <span class="zylem-property-value">X:0.00 Y:-9.81 Z:0.00</span>
          </div>
          <div class="zylem-property-row">
            <span class="zylem-property-label">Image</span>
            <span
              class="zylem-property-value zylem-property-value--clickable"
              title="Click to toggle full path"
              onClick={() => setExpanded(!expanded())}
            >
              {expanded() ? FULL_PATH : TRUNCATED_PATH}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
