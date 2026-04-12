/**
 * CLI: run gltfpack (optional), then Voronoi fracture + write destructible prebake sidecar JSON.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { DestructibleMesh } from '@dgreenheck/three-pinata';
import {
	buildFractureGeometryCacheKey,
	buildNormalizedFractureSourceGeometry,
	destructibleFragmentsToPlainResponse,
	pinataFractureOptionsToPlain,
	plainFractureOptionsToPinata,
	type PlainFractureOptions,
} from '@zylem/game-lib/behavior/destructible-3d/prebake-build';
import { MeshBasicMaterial, type Group } from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

import { findFirstMesh, findMeshByName } from './find-mesh';
import { buildSidecarV1 } from './sidecar-json';

const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

type CliFlags = {
	input?: string;
	outputGlb?: string;
	outputJson?: string;
	noPack: boolean;
	gltfpackBin: string;
	report?: string;
	meshName?: string;
	fragmentCount?: number;
	seed?: number;
	voronoiMode?: '3D' | '2.5D';
	fractureMethod?: 'voronoi' | 'simple';
	config?: string;
	help: boolean;
};

function defaultPlainFractureOptions(): PlainFractureOptions {
	return {
		fractureMethod: 'voronoi',
		fragmentCount: 12,
		fracturePlanes: { x: true, y: true, z: true },
		textureScale: [1, 1],
		textureOffset: [0, 0],
		voronoiOptions: {
			mode: '3D',
			useApproximation: false,
			approximationNeighborCount: 12,
			projectionAxis: null,
		},
	};
}

function mergePlainFractureOptions(
	base: PlainFractureOptions,
	override: Partial<PlainFractureOptions> | undefined,
): PlainFractureOptions {
	if (!override) {
		return base;
	}

	const voronoiDefaults: Pick<
		NonNullable<PlainFractureOptions['voronoiOptions']>,
		'useApproximation' | 'approximationNeighborCount' | 'projectionAxis'
	> = {
		useApproximation: false,
		approximationNeighborCount: 12,
		projectionAxis: null,
	};
	const baseV = base.voronoiOptions;
	const overV = override.voronoiOptions;
	const nextVoronoi =
		overV !== undefined
			? {
				...voronoiDefaults,
				...baseV,
				...overV,
			}
			: baseV;

	return {
		...base,
		...override,
		fracturePlanes: {
			...base.fracturePlanes,
			...override.fracturePlanes,
		},
		textureScale: override.textureScale ?? base.textureScale,
		textureOffset: override.textureOffset ?? base.textureOffset,
		voronoiOptions: nextVoronoi,
	};
}

function printHelp(): void {
	console.log(`zylem-destructible-prebake <input.glb> [options]

Pack with gltfpack, then write optimized GLB + <name>.destructible-prebake.json sidecar.

Options:
  -o, --output-glb <path>     Output path for packed GLB (required unless --no-pack)
  -j, --output-json <path>    Sidecar JSON path (default: next to output GLB)
  --no-pack                   Skip gltfpack; prebake this GLB in place (use with final assets)
  --gltfpack-bin <path>       gltfpack executable (default: gltfpack on PATH)
  -r, --report <path>         gltfpack -r report JSON path
  --mesh-name <name>          Fracture mesh by object name (default: first mesh)
  --fragment-count <n>        Voronoi fragment count
  --seed <n>                  Random seed
  --voronoi-mode <3D|2.5D>    Voronoi mode
  --fracture-method <m>       voronoi | simple
  --config <path>             JSON merged into plain fracture options
  -h, --help                  Show help
`);
}

function parseArgs(argv: string[]): CliFlags {
	const flags: CliFlags = {
		noPack: false,
		gltfpackBin: 'gltfpack',
		help: false,
	};

	const positional: string[] = [];
	const args = argv.filter((a) => a !== '--');
	for (let i = 0; i < args.length; i += 1) {
		const a = args[i];
		if (a === undefined) {
			break;
		}

		if (a === '-h' || a === '--help') {
			flags.help = true;
			continue;
		}
		if (a === '--no-pack') {
			flags.noPack = true;
			continue;
		}
		if (a === '-o' || a === '--output-glb') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.outputGlb = v;
			i += 1;
			continue;
		}
		if (a === '-j' || a === '--output-json') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.outputJson = v;
			i += 1;
			continue;
		}
		if (a === '--gltfpack-bin') {
			const v = args[i + 1];
			flags.gltfpackBin = v ?? 'gltfpack';
			i += 1;
			continue;
		}
		if (a === '-r' || a === '--report') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.report = v;
			i += 1;
			continue;
		}
		if (a === '--mesh-name') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.meshName = v;
			i += 1;
			continue;
		}
		if (a === '--fragment-count') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.fragmentCount = Number(v);
			i += 1;
			continue;
		}
		if (a === '--seed') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.seed = Number(v);
			i += 1;
			continue;
		}
		if (a === '--voronoi-mode') {
			const v = args[i + 1];
			if (v === '3D' || v === '2.5D') {
				flags.voronoiMode = v;
			}
			i += 1;
			continue;
		}
		if (a === '--fracture-method') {
			const v = args[i + 1];
			if (v === 'voronoi' || v === 'simple') {
				flags.fractureMethod = v;
			}
			i += 1;
			continue;
		}
		if (a === '--config') {
			const v = args[i + 1];
			if (!v) {
				throw new Error(`${a} requires a value`);
			}
			flags.config = v;
			i += 1;
			continue;
		}
		if (a.startsWith('-')) {
			throw new Error(`Unknown option: ${a}`);
		}
		positional.push(a);
	}

	if (positional[0]) {
		flags.input = positional[0];
	}
	return flags;
}

function ensureGltfpack(bin: string): void {
	const result = spawnSync(bin, ['-h'], { encoding: 'utf8' });
	if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT') {
		throw new Error(
			`${bin} was not found. Install gltfpack (meshoptimizer) or pass --gltfpack-bin.`,
		);
	}
	if (result.error) {
		throw result.error;
	}
}

function runGltfpack(options: {
	bin: string;
	input: string;
	output: string;
	report?: string;
}): void {
	const args = ['-i', options.input, '-o', options.output, '-cc', '-kn'];
	if (options.report) {
		args.push('-r', options.report);
	}

	const result = spawnSync(options.bin, args, {
		encoding: 'utf8',
		stdio: 'pipe',
	});

	if (result.error) {
		throw result.error;
	}

	if (result.status !== 0) {
		throw new Error(
			[`gltfpack failed`, result.stdout?.trim(), result.stderr?.trim()]
				.filter(Boolean)
				.join('\n'),
		);
	}
}

function sha256File(filePath: string): string {
	const buf = readFileSync(filePath);
	return createHash('sha256').update(buf).digest('hex');
}

async function loadGltf(glbPath: string) {
	await MeshoptDecoder.ready;

	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath(DRACO_DECODER_PATH);

	const loader = new GLTFLoader();
	loader.setDRACOLoader(dracoLoader);
	loader.setMeshoptDecoder(MeshoptDecoder);

	const url = pathToFileURL(path.resolve(glbPath)).href;
	return loader.loadAsync(url);
}

function defaultSidecarPath(glbPath: string): string {
	const resolved = path.resolve(glbPath);
	const dir = path.dirname(resolved);
	const base = path.basename(resolved, path.extname(resolved));
	return path.join(dir, `${base}.destructible-prebake.json`);
}

async function main(): Promise<void> {
	const flags = parseArgs(process.argv.slice(2));
	if (flags.help) {
		printHelp();
		process.exit(0);
	}

	if (!flags.input) {
		printHelp();
		process.exitCode = 1;
		throw new Error('Missing input GLB path.');
	}

	const inputResolved = path.resolve(flags.input);

	let glbToPrebake: string;
	if (flags.noPack) {
		glbToPrebake = inputResolved;
	} else {
		if (!flags.outputGlb) {
			throw new Error('Packed mode requires -o / --output-glb.');
		}
		ensureGltfpack(flags.gltfpackBin);
		const outGlb = path.resolve(flags.outputGlb);
		const reportPath = flags.report ? path.resolve(flags.report) : undefined;
		if (reportPath) {
			runGltfpack({
				bin: flags.gltfpackBin,
				input: inputResolved,
				output: outGlb,
				report: reportPath,
			});
		} else {
			runGltfpack({
				bin: flags.gltfpackBin,
				input: inputResolved,
				output: outGlb,
			});
		}
		glbToPrebake = outGlb;
	}

	const jsonOut = flags.outputJson
		? path.resolve(flags.outputJson)
		: defaultSidecarPath(glbToPrebake);

	let filePlain: Partial<PlainFractureOptions> | undefined;
	if (flags.config) {
		const raw = readFileSync(path.resolve(flags.config), 'utf8');
		filePlain = JSON.parse(raw) as Partial<PlainFractureOptions>;
	}

	let plain = mergePlainFractureOptions(defaultPlainFractureOptions(), filePlain);

	if (flags.fractureMethod !== undefined) {
		plain = { ...plain, fractureMethod: flags.fractureMethod };
	}
	if (flags.fragmentCount !== undefined && !Number.isNaN(flags.fragmentCount)) {
		plain = { ...plain, fragmentCount: flags.fragmentCount };
	}
	if (flags.seed !== undefined && !Number.isNaN(flags.seed)) {
		plain = { ...plain, seed: flags.seed };
	}
	if (flags.voronoiMode !== undefined) {
		plain = mergePlainFractureOptions(plain, {
			voronoiOptions: { mode: flags.voronoiMode },
		} as Partial<PlainFractureOptions>);
	}

	const fractureOptions = plainFractureOptionsToPinata(plain);
	const fractureCacheKey = buildFractureGeometryCacheKey(fractureOptions);
	const plainRecorded = pinataFractureOptionsToPlain(fractureOptions);

	const gltf = await loadGltf(glbToPrebake);
	const root = gltf.scene as Group;
	const mesh = flags.meshName
		? findMeshByName(root, flags.meshName)
		: findFirstMesh(root);

	if (!mesh) {
		throw new Error(
			flags.meshName
				? `No mesh named "${flags.meshName}" under the glTF scene.`
				: 'No mesh found under the glTF scene.',
		);
	}

	const normalizedGeometry = buildNormalizedFractureSourceGeometry(mesh, root);
	const outerMaterial = new MeshBasicMaterial();
	const innerMaterial = new MeshBasicMaterial();
	const source = new DestructibleMesh(
		normalizedGeometry,
		outerMaterial,
		innerMaterial,
	);

	let fragments: DestructibleMesh[];
	try {
		fragments = source.fracture(fractureOptions);
	} finally {
		source.geometry.dispose();
		outerMaterial.dispose();
		innerMaterial.dispose();
	}

	const { response } = destructibleFragmentsToPlainResponse(fragments);

	const sourceSha256 = sha256File(glbToPrebake);
	const sidecar = buildSidecarV1({
		fractureCacheKey,
		sourceSha256,
		sourceGlbPath: path.basename(glbToPrebake),
		plainFractureOptions: plainRecorded,
		response,
	});

	writeFileSync(jsonOut, `${JSON.stringify(sidecar, null, '\t')}\n`, 'utf8');
	console.log(`Wrote ${jsonOut}`);
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
