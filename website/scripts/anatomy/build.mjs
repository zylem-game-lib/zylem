import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { fileURLToPath } from 'node:url';
import { buildGallery } from './gallery-build.mjs';
import { buildGeometry } from './geometry.mjs';
import { STATIONS } from './model.ts';
import { ISO_CSS } from './vendor/iso-kit.mjs';

const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const geometry = buildGeometry();
// These three local modules have no runtime dependencies other than each other.
const script = ['model.ts', 'spatial.ts', 'live.ts'].map(name => stripTypeScriptTypes(read(name))
	.replace(/^import .*?;\s*$/gm, '').replace(/^export /gm, '')).join('\n');
const theme = process.argv.includes('--dark') ? 'dark' : 'light';
const html = `<!doctype html>
<!-- Anatomy kit: ${read('vendor/LICENSE')} -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Inspect how a Zylem game update becomes a scene, and why drawing runs on its own clock.">
<title>The Zylem frame press</title><style>${ISO_CSS}\n${read('style.css')}</style></head>
<body class="iso" data-theme="${theme}"><main class="page">
<header class="masthead"><div><span class="wordmark">zylem</span><span class="eyebrow">Anatomy / No. 01</span></div><button type="button" data-theme> ${theme === 'light' ? 'Dark' : 'Light'} theme</button></header>
<h1>A game, one update at a time.</h1>
<p class="intro">Inside Zylem, input becomes intent, simulation becomes a scene, and a separate renderer draws it. Follow one workpiece through the frame press to see how the parts fit.</p>
<section data-machine tabindex="0" aria-label="Zylem frame press. Space plays or pauses, Right steps one station, R resets.">
<div class="iso-plate">
<div class="machine-head"><span class="fig-no">Fig 01 · The frame press</span><span>Six stations. Two clocks.</span></div>
<div class="iso-stage" tabindex="0" role="group" aria-label="Mechanical model. On narrow screens scroll horizontally to inspect the complete machine.">${geometry.svg}</div>
<div class="machine-foot"><span data-motion-note>Space play/pause · → step · R reset</span><span data-readout>Update 1 · station 1 / 6</span></div>
<div class="controls"><button type="button" data-play>Pause animation</button><button type="button" data-step>Step station →</button><button type="button" data-reset>Reset</button><button type="button" data-zoom aria-pressed="false">Zoom drawing</button><label class="speed">Playback <select data-speed aria-label="Animation speed"><option value="0.5">½×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div>
</div>
<nav class="stations" aria-label="Inspect an update station">${STATIONS.map((station, i) => `<button type="button" data-station="${i}" aria-pressed="${i === 0}"><small>0${i + 1}</small>${station.title}</button>`).join('')}</nav>
<div class="explanation"><section><span class="eyebrow" data-layer>${STATIONS[0].layer}</span><h2 data-title>${STATIONS[0].title}</h2><p data-detail>${STATIONS[0].detail}</p><code data-call>${STATIONS[0].call}</code></section>
<section class="renderer" aria-label="Independent renderer"><span class="eyebrow" data-clock-state>Two independent clocks</span><div class="counters"><div><strong data-revision>0</strong><span>SCENE REVISION</span></div><div><strong data-draw-count>0</strong><span>DRAW COUNT</span></div></div><p>The inspection shutter draws revision <b data-drawn-revision>0</b>. Pause game updates and it keeps drawing the last scene.</p><button type="button" data-updates aria-pressed="false">Pause game updates</button><button type="button" data-draw>Draw once</button></section></div>
<p class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-announcement></p>
</section>
<footer class="note"><p>This is a slowed explanation, not a profiler. Station spacing, playback speed and counters belong to the illustration. Zylem’s update and render callbacks run independently on the same JavaScript thread; a draw cannot interrupt an update.</p><span>Made with <a href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">Anatomy ↗</a><br><a href="https://github.com/zylem-game-lib/zylem/blob/d43002a97b55f723bb4ab047088c65b2bd7862cb/packages/game-lib/src/lib/stage/zylem-stage.ts" target="_blank" rel="noreferrer">Read the source ↗</a></span></footer>
</main><script type="application/json" id="geometry">${JSON.stringify({ parts: geometry.parts, vectors: geometry.vectors })}</script>
<script type="module">${script.replaceAll('</script', '<\\/script')}</script></body></html>`;
const output = new URL('../../static/anatomy/frame-machine/index.html', import.meta.url);
mkdirSync(new URL('.', output), { recursive: true });
writeFileSync(output, html);
console.log(`Built ${fileURLToPath(output)} (${geometry.parts.length} solids, ${Math.round(html.length / 1024)} KiB).`);

buildGallery();
