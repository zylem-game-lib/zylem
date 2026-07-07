import { For } from 'solid-js';

const items = [
  { label: 'Dashboard', active: false },
  { label: 'Game Editor', active: true },
  { label: 'Settings', active: false },
  { label: 'Help', active: false },
];

export function Sidebar() {
  return (
    <div class="section" id="sidebar">
      <h2>Sidebar</h2>
      <h3>.sidebar + .sidebar-item</h3>
      <div style={{ width: '250px' }}>
        <div class="sidebar" style={{ padding: 'var(--zylem-spacing-sm)' }}>
          <For each={items}>
            {(item) => (
              <div
                class={item.active ? 'sidebar-item active' : 'sidebar-item'}
                style={{ padding: 'var(--zylem-spacing-sm)', cursor: 'pointer' }}
              >
                {item.label}
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
