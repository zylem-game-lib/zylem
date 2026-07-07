import { AccordionDemo } from '../demos/AccordionDemo';

export function Accordion() {
  return (
    <div class="section" id="accordion">
      <h2>Accordion</h2>
      <h3>.zylem-accordion + .accordion-* (Kobalte, click headers to expand)</h3>
      <div class="demo-container" style={{ width: '400px' }}>
        <AccordionDemo defaultExpanded={['stage-config']} />
      </div>
    </div>
  );
}
