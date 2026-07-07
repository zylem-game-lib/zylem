import { Button } from '../../../src/components';

export function Buttons() {
  return (
    <div class="section" id="buttons">
      <h2>Buttons</h2>
      <h3>.zylem-button (via the Button component)</h3>
      <div class="demo-row">
        <Button>Default Button</Button>
        <Button
          style={{
            background: 'var(--zylem-color-primary)',
            color: 'var(--zylem-color-background-translucent)',
          }}
        >
          Hover State
        </Button>
        <Button
          style={{
            background: 'var(--zylem-color-active)',
            color: 'var(--zylem-color-background-translucent)',
          }}
        >
          Active State
        </Button>
      </div>
    </div>
  );
}
