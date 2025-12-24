import type { Component } from 'solid-js';
import { Toolbar } from '../toolbar/Toolbar';
import { AccordionMenu } from './AccordionMenu';

export const Menu: Component = () => {
  return (
    <div class="zylem-menu">
      <Toolbar />
      <AccordionMenu />
    </div>
  );
};
