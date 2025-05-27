import { render } from 'solid-js/web';
import { createSignal, onMount } from 'solid-js';
import { Menu } from './Menu';
import { DEBUG_COLORS, DEBUG_SIZES } from './constants';
import './Debug.css';

/**
 * DebugMenu root component. Handles open/close state and layout.
 */
function Debug() {
  const [isOpen, setIsOpen] = createSignal(false);

  onMount(() => {
    // Set CSS variables for colors
    document.documentElement.style.setProperty(
      '--debug-primary',
      DEBUG_COLORS.primary,
    );
    document.documentElement.style.setProperty(
      '--debug-background',
      DEBUG_COLORS.background,
    );
    document.documentElement.style.setProperty(
      '--debug-console-background',
      DEBUG_COLORS.consoleBackground,
    );
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
      <button
        id="zylem-debug-button"
        type="button"
        onClick={toggleMenu}
        style={{ 'z-index': 1001 }}
      />
      {isOpen() && (
        <div
          style={{
            width: `${DEBUG_SIZES.menuWidth}%`,
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
