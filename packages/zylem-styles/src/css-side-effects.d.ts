// Ambient types for plain-CSS side-effect imports (e.g. `import './fonts.css'`).
// vanilla-extract `*.css.ts` files resolve to real modules and are unaffected by
// this fallback; it only gives raw `.css` files a module type so the declaration
// build (TypeScript 6+) does not emit TS2882 for side-effect imports.
declare module '*.css';
