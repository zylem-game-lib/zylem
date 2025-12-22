import type { Component } from 'solid-js';
import { Toolbar } from '../toolbar/Toolbar';
import { AccordionMenu } from './AccordionMenu';
import { Console } from '../console/Console';

export const Menu: Component<{ onClose?: () => void }> = (props) => {
  return (
    <div class="zylem-menu">
      <Toolbar onClose={props.onClose} />
      <div class="zylem-accordion-container">
        <AccordionMenu />
      </div>
      <div class="zylem-console-container">
        <Console />
      </div>
    </div>
  );
};
