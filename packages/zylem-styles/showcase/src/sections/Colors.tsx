import { For } from 'solid-js';

type TokenRow = Array<{ token: string; darkLabel?: boolean }>;

const rows: TokenRow[] = [
  [
    { token: '--zylem-color-primary' },
    { token: '--zylem-color-primary-hover' },
    { token: '--zylem-color-primary-active' },
    { token: '--zylem-color-accent' },
  ],
  [
    { token: '--zylem-color-background' },
    { token: '--zylem-color-background-translucent' },
    { token: '--zylem-color-surface' },
    { token: '--zylem-color-border' },
  ],
  [
    { token: '--zylem-color-active', darkLabel: true },
    { token: '--zylem-color-active-hover', darkLabel: true },
    { token: '--zylem-color-success-hover' },
  ],
  [
    { token: '--zylem-color-text', darkLabel: true },
    { token: '--zylem-color-text-secondary', darkLabel: true },
    { token: '--zylem-color-console-background' },
    { token: '--zylem-color-console-text', darkLabel: true },
  ],
];

export function Colors() {
  return (
    <div class="section" id="colors">
      <h2>Colors (--zylem-color-*)</h2>
      <For each={rows}>
        {(row) => (
          <div class="demo-row">
            <For each={row}>
              {(entry) => (
                <div class="color-token" style={{ background: `var(${entry.token})` }}>
                  <span
                    class="color-token-label"
                    style={entry.darkLabel ? { color: 'var(--zylem-color-background)' } : undefined}
                  >
                    {entry.token}
                  </span>
                </div>
              )}
            </For>
          </div>
        )}
      </For>
    </div>
  );
}
