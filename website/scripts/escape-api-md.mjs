#!/usr/bin/env node
/**
 * Docusaurus compiles docs as MDX even when `markdown.format` is `md`.
 * TypeDoc signatures put `{ moveX, moveY }` in prose, which MDX evaluates.
 * Escape braces outside fenced code blocks.
 */
import fs from 'node:fs';
import path from 'node:path';

const apiRoot = path.resolve('docs/api');

function escapeProse(text) {
	const parts = text.split(/(```[\s\S]*?```)/g);
	return parts
		.map((part) => {
			if (part.startsWith('```')) return part;
			return part.replaceAll('{', '\\{').replaceAll('}', '\\}');
		})
		.join('');
}

function injectIndexFrontmatter(file, text) {
	if (path.basename(file) !== 'index.md') return text;
	if (text.startsWith('---\n')) return text;
	const heading = text.match(/^# (.+)$/m);
	const title = heading ? heading[1].trim() : path.basename(path.dirname(file));
	return `---\ntitle: ${JSON.stringify(title)}\nsidebar_label: ${JSON.stringify(title)}\n---\n\n${text}`;
}

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full);
		else if (entry.name.endsWith('.md')) {
			const src = fs.readFileSync(full, 'utf8');
			const next = injectIndexFrontmatter(full, escapeProse(src));
			if (next !== src) fs.writeFileSync(full, next);
		}
	}
}

if (fs.existsSync(apiRoot)) walk(apiRoot);
