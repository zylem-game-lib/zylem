import { render } from 'solid-js/web';
import { createSignal, For, Show } from 'solid-js';

import { Menu } from './editor-panel/Menu';
import { EditorToggleButton } from './EditorToggleButton';
import { FloatingPanel } from './common/FloatingPanel';
import { DetachedPanel } from './editor-panel/DetachedPanel';
import { debugStore, setPanelPosition } from '.';

// Panel dimensions
const PANEL_WIDTH = 460;
const PANEL_HEIGHT = 600;
const PANEL_MARGIN = 20;

/**
 * Calculate the initial panel position based on the toggle button's quadrant.
 * Panel appears in the same quadrant as the button.
 */
const getInitialPanelPosition = () => {
  // Use saved position if available
  if (debugStore.panelPosition) {
    return debugStore.panelPosition;
  }

  const buttonPos = debugStore.toggleButtonPosition;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Determine which quadrant the button is in
  const isRightSide = buttonPos.x > windowWidth / 2;
  const isBottomSide = buttonPos.y > windowHeight / 2;

  // Position panel in the same quadrant, offset from the button
  let x: number;
  let y: number;

  if (isRightSide) {
    // Right side: align panel to right edge
    x = windowWidth - PANEL_WIDTH - PANEL_MARGIN;
  } else {
    // Left side: align panel to left edge
    x = PANEL_MARGIN;
  }

  if (isBottomSide) {
    // Bottom: position panel above or at bottom
    y = Math.max(PANEL_MARGIN, windowHeight - PANEL_HEIGHT - PANEL_MARGIN);
  } else {
    // Top: position panel near top
    y = PANEL_MARGIN;
  }

  return { x, y };
};

/**
 * Editor root component. Handles open/close state and layout.
 * Renders both the main editor panel and any detached floating panels.
 */
export function Editor() {
  const [isOpen, setIsOpen] = createSignal(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen());
  };
  const closeMenu = () => setIsOpen(false);

  const handlePanelMove = (pos: { x: number; y: number }) => {
    setPanelPosition(pos);
  };

  // Get list of detached panel IDs
  const getDetachedPanelIds = () => Object.keys(debugStore.detachedPanels);

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
      }}
    >
      <EditorToggleButton onToggle={toggleMenu} />
      <Show when={isOpen()}>
        <FloatingPanel
          title="Zylem Editor"
          initialPosition={getInitialPanelPosition()}
          initialSize={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}
          minSize={{ width: 300, height: 200 }}
          collapsible={true}
          onClose={closeMenu}
          onMove={handlePanelMove}
        >
          {(isCollapsed) => <Menu isCollapsed={isCollapsed} />}
        </FloatingPanel>
      </Show>

      {/* Render detached panels */}
      <For each={getDetachedPanelIds()}>
        {(panelId) => <DetachedPanel panelId={panelId} />}
      </For>

      {/* Right area reserved for future content */}
      <div style={{ flex: 1 }} />
    </div>
  );
}

// Only render if we're not in a test environment and the container exists
if (typeof window !== 'undefined' && !import.meta.env.VITEST) {
  const container = document.getElementById('zylem-editor-container');
  if (container) {
    render(() => <Editor />, container);
  }
}
