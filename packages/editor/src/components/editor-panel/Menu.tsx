import { Show, type Component, type Accessor } from 'solid-js';
import { Toolbar } from '../toolbar/Toolbar';
import { AccordionMenu } from './AccordionMenu';

interface MenuProps {
  isCollapsed: Accessor<boolean>;
}

export const Menu: Component<MenuProps> = (props) => {
  return (
    <div class="zylem-menu">
      <Toolbar />
      <Show when={!props.isCollapsed()}>
        <AccordionMenu />
      </Show>
    </div>
  );
};
