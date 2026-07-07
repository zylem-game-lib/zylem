import { AccordionDemo } from '../demos/AccordionDemo';
import { ToolbarDemo } from '../demos/ToolbarDemo';

/** Mirror of the editor's Menu: toolbar + accordion inside .zylem-menu. */
export function Menu() {
  return (
    <div class="section" id="menu">
      <h2>Menu Container</h2>
      <h3>.zylem-menu (editor panel body: Toolbar + AccordionMenu)</h3>
      <div style={{ width: '460px', height: '500px' }}>
        <div class="zylem-menu">
          <ToolbarDemo />
          <AccordionDemo defaultExpanded={['console']} />
        </div>
      </div>
    </div>
  );
}
