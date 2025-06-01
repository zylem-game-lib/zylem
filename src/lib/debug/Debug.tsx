import { render, style } from 'solid-js/web';
import { createEffect, createSignal } from 'solid-js';

import { debugStore } from './debug-store';

import { Menu } from './menu/Menu';
import './Debug.css';

/**
 * DebugMenu root component. Handles open/close state and layout.
 */
function Debug() {
  const [showDebugMenu, setShowDebugMenu] = createSignal(false);
  const [isOpen, setIsOpen] = createSignal(false);

  createEffect(() => {
    setShowDebugMenu(debugStore.debug);
  });

  const toggleMenu = () => {
    setIsOpen(!isOpen());
  };
  const closeMenu = () => setIsOpen(false);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        'pointer-events': 'visible',
      }}
    >
      {showDebugMenu() && (
        <div style={{ display: 'flex', 'z-index': 1001 }}>
          <button id="zylem-debug-button" type="button" onClick={toggleMenu} />
        </div>
      )}
      {isOpen() && (
        <div
          style={{
            width: '33%',
            'min-width': '460px',
            height: '100%',
            'z-index': 1002,
          }}
        >
          <Menu onClose={closeMenu} />
        </div>
      )}
      {/* Right area reserved for future content */}
      <div style={{ flex: 1 }} />
    </div>
  );
}

render(() => <Debug />, document.getElementById('zylem-debug-container')!);
