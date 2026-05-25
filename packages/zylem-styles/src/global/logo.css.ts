import { globalStyle } from '@vanilla-extract/css';
import { LOGO_DATA_URL } from './logo-data';

const logoUrlValue = `url('${LOGO_DATA_URL}')`;

// The editor's web component lives in a shadow DOM, where `:root` doesn't
// resolve — set the custom property on `:host` too so the toggle button
// can resolve `var(--zylem-logo-url)` inside the shadow tree.
globalStyle(':root', {
  vars: { '--zylem-logo-url': logoUrlValue },
});

globalStyle(':host', {
  vars: { '--zylem-logo-url': logoUrlValue },
});
