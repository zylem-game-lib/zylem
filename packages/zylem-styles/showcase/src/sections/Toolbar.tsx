import { ToolbarDemo } from '../demos/ToolbarDemo';

export function Toolbar() {
  return (
    <div class="section" id="toolbar">
      <h2>Toolbar</h2>
      <h3>.zylem-toolbar + .zylem-toolbar-btn + .zylem-tooltip (hover for tooltip)</h3>
      <div class="demo-container">
        <ToolbarDemo />
      </div>
    </div>
  );
}
