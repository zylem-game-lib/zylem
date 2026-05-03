/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXAMPLES_PREVIEW_CDN_BASE_URL?: string;
    readonly VITE_EXAMPLES_PREVIEW_IMAGE_EXTENSION?: string;
    /** SpacetimeDB base URL for examples (`ws://` / `wss://` preferred; `http(s)://` is normalized). */
    readonly VITE_STDB_URI?: string;
    /**
     * Override for the demo asset CDN base URL (every demo pack).
     *
     * When set, `demoAsset(...)` composes URLs against this value
     * instead of the dev-time `/cdn/demos` proxy or the production
     * CDN default (`https://assets.zylem.cloud/demos`). Useful for
     * staging buckets, local mirrors, or CI snapshot tests.
     */
    readonly VITE_DEMOS_ASSET_BASE_URL?: string;
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
