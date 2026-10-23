import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { EXHIBITS } from './catalog.ts';
import { buildExhibitGeometry } from './gallery-geometry.mjs';
import { ISO_CSS } from './vendor/iso-kit.mjs';
const read = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export function buildGallery() {
	const script = ['catalog.ts', 'spatial.ts', 'gallery-spatial.ts', 'gallery-live.ts'].map(name => stripTypeScriptTypes(read(name)).replace(/^import .*?;\s*$/gm, '').replace(/^export /gm, '')).join('\n');
	for (const [index, exhibit] of EXHIBITS.entries()) {
		const geometry = buildExhibitGeometry(exhibit), stop = exhibit.stops[0];
		const html = `<!doctype html>
<!-- Anatomy kit: ${read('vendor/LICENSE')} -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escape(exhibit.intro)}"><title>Zylem ${exhibit.name} · ${exhibit.title}</title>
<style>${ISO_CSS}\n${read('style.css')}\n${read('gallery.css')}</style></head>
<body class="iso" data-theme="light"><main class="page">
<header class="masthead"><div><span class="wordmark">zylem</span><span class="eyebrow">Anatomy / ${exhibit.name}</span></div><button type="button" data-theme>Dark theme</button></header>
<h1>${exhibit.name}, through a machine.</h1><p class="intro">${escape(exhibit.intro)}</p>
<section data-machine tabindex="0" aria-label="${escape(exhibit.title)}. Arrow keys inspect parts, Space toggles the tour, R resets.">
<div class="iso-plate"><div class="machine-head"><span class="fig-no">Fig 0${index + 2} · ${exhibit.title}</span><span>${exhibit.mechanism}</span></div>
<div class="iso-stage" tabindex="0" role="group" aria-label="${escape(exhibit.title)}. Zoom to inspect small parts.">${geometry.svg}</div>
<div class="machine-foot"><span data-motion-note>Space play/pause · ← → inspect · R reset</span><span data-readout></span></div>
<div class="controls"><button type="button" data-play>Pause tour</button><button type="button" data-previous>← Previous</button><button type="button" data-next>Next part →</button><button type="button" data-reset>Reset</button><button type="button" data-zoom aria-pressed="false">Zoom drawing</button></div></div>
<nav class="stations" style="--stop-count:${exhibit.stops.length}" aria-label="Inspect ${exhibit.name} parts">${exhibit.stops.map((item, i) => `<button type="button" data-choice="${i}" aria-pressed="${i === 0}"><small>0${i + 1}</small>${item.title}</button>`).join('')}</nav>
<div class="explanation"><section><span class="eyebrow" data-layer>${stop.label}</span><h2 data-title>${stop.title}</h2><p data-detail>${escape(stop.detail)}</p><code data-call>${escape(stop.call)}</code></section>
<aside class="renderer"><span class="eyebrow">What this means</span><p class="result" data-result>${escape(stop.result)}</p><a data-source href="https://github.com/zylem-game-lib/zylem/blob/d43002a97b55f723bb4ab047088c65b2bd7862cb/${stop.source}" target="_blank" rel="noreferrer">Read this part of the source ↗</a></aside></div>
<p class="sr-only" role="status" aria-live="polite" aria-atomic="true" data-announcement></p></section>
<footer class="note"><p>${escape(exhibit.note)} Motion belongs to this explanation; it is not runtime instrumentation.</p><span>Made with <a href="https://skills.wheresryan.sh/anatomy" target="_blank" rel="noreferrer">Anatomy ↗</a></span></footer>
</main><script type="application/json" id="exhibit-data">${JSON.stringify({ exhibit, parts: geometry.parts, spacing: geometry.spacing, vectors: geometry.vectors }).replaceAll('<', '\\u003c')}</script>
<script type="module">${script.replaceAll('</script', '<\\/script')}</script></body></html>`;
		const output = new URL(`../../static/anatomy/${exhibit.id}-machine/index.html`, import.meta.url);
		mkdirSync(new URL('.', output), { recursive: true }); writeFileSync(output, html);
		console.log(`Built ${exhibit.name}: ${geometry.parts.length} solids, ${Math.round(html.length / 1024)} KiB.`);
	}
}
