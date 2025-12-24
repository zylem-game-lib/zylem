/// <reference types="vite/client" />

// Declare CSS modules for local styles (bundled with editor)
declare module '../styles/base.css?raw' {
    const css: string;
    export default css;
}

declare module '../styles/editor.css?raw' {
    const css: string;
    export default css;
}

// Also support absolute module paths
declare module '*.css?raw' {
    const css: string;
    export default css;
}
