import type { Component } from 'solid-js';
import { Toolbar } from '../toolbar/Toolbar';
import { AccordionMenu } from './AccordionMenu';
import { Console } from '@lib/ui/console/Console';
import './Menu.css';

export const Menu: Component<{ onClose?: () => void }> = (props) => {
  return (
    <div class="zylem-debug-menu">
      <Toolbar onClose={props.onClose} />
      <div class="zylem-debug-accordion-container">
        <AccordionMenu />
      </div>
      <div class="zylem-debug-console-container">
        <Console />
      </div>
    </div>
  );
};
