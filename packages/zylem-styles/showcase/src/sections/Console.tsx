import { ConsoleDemo } from '../demos/ConsoleDemo';

export function Console() {
  return (
    <div class="section" id="console">
      <h2>Console</h2>
      <h3>.zylem-console-container + .zylem-console-wrapper + .zylem-console-clear</h3>
      <div style={{ width: '500px', height: '200px', display: 'flex' }}>
        <ConsoleDemo />
      </div>
    </div>
  );
}
