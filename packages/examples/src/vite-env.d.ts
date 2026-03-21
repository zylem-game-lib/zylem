/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXAMPLES_PREVIEW_CDN_BASE_URL?: string;
    readonly VITE_EXAMPLES_PREVIEW_IMAGE_EXTENSION?: string;
}

// Declare CSS modules for @zylem/styles
declare module '@zylem/styles/styles.css?raw' {
    const css: string;
    export default css;
}

declare module '*.wasm?url' {
    const url: string;
    export default url;
}
