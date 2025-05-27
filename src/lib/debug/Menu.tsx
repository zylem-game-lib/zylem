import type { Component } from 'solid-js';
import { Toolbar } from './Toolbar';
import { AccordionMenu } from './AccordionMenu';
import { Console } from './Console';
import './Menu.css';

/**
 * Main debug menu layout: Toolbar, AccordionMenu, and Console.
 */
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
