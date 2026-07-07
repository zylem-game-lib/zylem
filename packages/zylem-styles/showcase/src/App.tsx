import { For } from 'solid-js';
import { Accordion } from './sections/Accordion';
import { Buttons } from './sections/Buttons';
import { Checkbox } from './sections/Checkbox';
import { Colors } from './sections/Colors';
import { Console } from './sections/Console';
import { DetachedPanel } from './sections/DetachedPanel';
import { Entities } from './sections/Entities';
import { FloatingPanel } from './sections/FloatingPanel';
import { Menu } from './sections/Menu';
import { PropertyList } from './sections/PropertyList';
import { Sidebar } from './sections/Sidebar';
import { SpacingSizing } from './sections/SpacingSizing';
import { Toolbar } from './sections/Toolbar';
import { Typography } from './sections/Typography';

const navLinks = [
  { href: '#colors', label: 'Colors' },
  { href: '#buttons', label: 'Buttons' },
  { href: '#toolbar', label: 'Toolbar' },
  { href: '#floating-panel', label: 'Floating Panel' },
  { href: '#detached-panel', label: 'Detached Panel' },
  { href: '#menu', label: 'Menu' },
  { href: '#accordion', label: 'Accordion' },
  { href: '#property-list', label: 'Property List' },
  { href: '#console', label: 'Console' },
  { href: '#entities', label: 'Entities' },
  { href: '#checkbox', label: 'Checkbox' },
  { href: '#sidebar', label: 'Sidebar' },
  { href: '#typography', label: 'Typography' },
  { href: '#spacing-sizing', label: 'Spacing & Sizing' },
];

export function App() {
  return (
    <div class="showcase">
      <h1>Zylem Styles Showcase</h1>
      <nav class="showcase-nav">
        <For each={navLinks}>{(link) => <a href={link.href}>{link.label}</a>}</For>
      </nav>
      <Colors />
      <Buttons />
      <Toolbar />
      <FloatingPanel />
      <DetachedPanel />
      <Menu />
      <Accordion />
      <PropertyList />
      <Console />
      <Entities />
      <Checkbox />
      <Sidebar />
      <Typography />
      <SpacingSizing />
    </div>
  );
}
