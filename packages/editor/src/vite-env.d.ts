/// <reference types="vite/client" />

// Declare CSS module for @zylem/ui package import
declare module '@zylem/ui/styles.css?raw' {
    const css: string;
    export default css;
}

// Generic CSS raw imports
declare module '*.css?raw' {
    const css: string;
    export default css;
}
