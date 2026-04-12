import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const RAW_ASSETS_DIR = path.join(PACKAGE_ROOT, 'raw-assets');
const OUTPUT_ASSETS_DIR = path.join(PACKAGE_ROOT, 'src', 'assets');
const REPORTS_DIR = path.join(RAW_ASSETS_DIR, 'reports');
const BASIS_OUTPUT_DIR = path.join(PACKAGE_ROOT, 'public', 'three', 'basis');

const require = createRequire(import.meta.url);
const threePackageRoot = path.resolve(
	path.dirname(require.resolve('three')),
	'..',
);
const basisSourceDir = path.join(
	threePackageRoot,
	'examples',
	'jsm',
	'libs',
	'basis',
);

const assetManifest = [
	'fisher-ship',
	'snake-ship',
	'vulture-ship',
	'cougar-ship',
].map((name) => ({
	name,
	source: path.join(RAW_ASSETS_DIR, `${name}.glb`),
	output: path.join(OUTPUT_ASSETS_DIR, `${name}.glb`),
	report: path.join(REPORTS_DIR, `${name}.json`),
}));

function formatBytes(size) {
	if (size < 1024) {
		return `${size} B`;
	}

	const units = ['KB', 'MB', 'GB'];
	let value = size;
	let unitIndex = -1;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}

	return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function ensureGltfpackAvailable() {
	const result = spawnSync('gltfpack', ['-h'], {
		cwd: PACKAGE_ROOT,
		encoding: 'utf8',
	});

	if (result.error?.code === 'ENOENT') {
		throw new Error(
			'gltfpack was not found on PATH. Install it and confirm the `gltfpack` shell command works before retrying.',
		);
	}

	if (result.error) {
		throw result.error;
	}
}

function ensureSourceAssetsExist() {
	for (const asset of assetManifest) {
		if (!fs.existsSync(asset.source)) {
			throw new Error(
				`Missing raw asset: ${path.relative(PACKAGE_ROOT, asset.source)}. Copy the source GLB into raw-assets before optimizing.`,
			);
		}
	}
}

function copyBasisTranscoderFiles() {
	fs.mkdirSync(BASIS_OUTPUT_DIR, { recursive: true });

	for (const filename of ['basis_transcoder.js', 'basis_transcoder.wasm']) {
		const source = path.join(basisSourceDir, filename);
		const destination = path.join(BASIS_OUTPUT_DIR, filename);

		if (!fs.existsSync(source)) {
			throw new Error(
				`Missing Three.js Basis transcoder file: ${path.relative(PACKAGE_ROOT, source)}`,
			);
		}

		fs.copyFileSync(source, destination);
	}
}

function optimizeAsset(asset) {
	const result = spawnSync(
		'gltfpack',
		[
			'-i',
			asset.source,
			'-o',
			asset.output,
			'-r',
			asset.report,
			'-cc',
			'-kn',
		],
		{
			cwd: PACKAGE_ROOT,
			encoding: 'utf8',
			stdio: 'pipe',
		},
	);

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(
			[
				`gltfpack failed for ${asset.name}.`,
				result.stdout?.trim(),
				result.stderr?.trim(),
			]
				.filter(Boolean)
				.join('\n'),
		);
	}

	const sourceSize = fs.statSync(asset.source).size;
	const outputSize = fs.statSync(asset.output).size;
	if (outputSize >= sourceSize) {
		throw new Error(
			`Optimized asset ${asset.name} is not smaller than the source (${formatBytes(sourceSize)} -> ${formatBytes(outputSize)}).`,
		);
	}

	return {
		...asset,
		sourceSize,
		outputSize,
	};
}

function main() {
	ensureGltfpackAvailable();
	ensureSourceAssetsExist();

	fs.mkdirSync(RAW_ASSETS_DIR, { recursive: true });
	fs.mkdirSync(OUTPUT_ASSETS_DIR, { recursive: true });
	fs.mkdirSync(REPORTS_DIR, { recursive: true });

	copyBasisTranscoderFiles();

	const results = assetManifest.map(optimizeAsset);
	for (const result of results) {
		console.log(
			`${result.name}: ${formatBytes(result.sourceSize)} -> ${formatBytes(result.outputSize)} (${path.relative(PACKAGE_ROOT, result.report)})`,
		);
	}

	console.log(
		`Copied Basis transcoders to ${path.relative(PACKAGE_ROOT, BASIS_OUTPUT_DIR)}`,
	);
}

try {
	main();
} catch (error) {
	console.error(error);
	process.exit(1);
}
