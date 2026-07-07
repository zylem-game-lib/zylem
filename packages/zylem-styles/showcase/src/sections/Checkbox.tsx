import { Checkbox as KCheckbox } from '@kobalte/core';
import Check from 'lucide-solid/icons/check';

function DemoCheckbox(props: { label: string; defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <KCheckbox.Root
      class="zylem-checkbox-root"
      defaultChecked={props.defaultChecked}
      disabled={props.disabled}
    >
      <KCheckbox.Input class="zylem-checkbox-input" />
      <KCheckbox.Control class="zylem-checkbox-control">
        <KCheckbox.Indicator>
          <Check class="zylem-checkbox-icon" />
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      <KCheckbox.Label class="zylem-checkbox-label">{props.label}</KCheckbox.Label>
    </KCheckbox.Root>
  );
}

export function Checkbox() {
  return (
    <div class="section" id="checkbox">
      <h2>Checkbox</h2>
      <h3>.zylem-checkbox-root / -input / -control / -icon / -label (Kobalte)</h3>
      <div class="demo-container">
        <div style={{ display: 'flex', 'flex-direction': 'column', gap: 'var(--zylem-spacing-md)' }}>
          <DemoCheckbox label="Show grid" defaultChecked />
          <DemoCheckbox label="Snap to grid" />
          <DemoCheckbox label="Physics debug (disabled)" disabled />
        </div>
      </div>
    </div>
  );
}
