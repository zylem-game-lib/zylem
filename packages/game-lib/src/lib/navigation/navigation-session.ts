import {
	type BridgeVec3,
	createLevelNavigation,
	type LevelDocument,
	NAVIGATION_GENERATOR,
	type NavigationAsset,
	type NavigationEdit,
	type NavigationPath,
	type NavigationStatus,
	type NavigationToolPayload,
	navigationSourceHash,
} from '@zylem/bridge';
import {
	ArrowHelper,
	Box3,
	Box3Helper,
	BufferGeometry,
	Group,
	Line,
	LineBasicMaterial,
	type Object3D,
	Raycaster,
	Vector3,
} from 'three';
import { setNavigationToolArmed } from '../debug/debug-state';
import type { NavigationBakeInput } from './bake';
import { disposeSourceMeshes, navigationSourceMeshes } from './geometry';
import type { NavigationMesh } from './nav-mesh';

export interface NavigationSessionHost {
	stageId: string;
	scene(): Object3D | null;
	status?(status: NavigationStatus): void;
	baked?(requestId: string, asset: NavigationAsset): void;
	path?(result: NavigationPath, requestId?: string): void;
	edit?(edit: NavigationEdit): void;
}

/** Route colours picked to read against the orange navmesh overlay. */
const ROUTE_COMPLETE = 0x00e5ff;
const ROUTE_PARTIAL = 0xff1744;
/** Above the overlay helper, which three leaves at the default order of 0. */
const ROUTE_RENDER_ORDER = 1;

function clearGroup(group: Object3D): void {
	group.traverse((child) => {
		const drawable = child as Line;
		drawable.geometry?.dispose();
		for (const m of Array.isArray(drawable.material) ? drawable.material : [drawable.material])
			m?.dispose();
	});
	group.removeFromParent();
	group.clear();
}
function encode(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i += 8192)
		binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
	return btoa(binary);
}
function decode(asset: NavigationAsset): Uint8Array {
	if (asset.version !== 1 || asset.generator !== NAVIGATION_GENERATOR)
		throw new Error('Navigation data uses an unsupported format. Bake it again.');
	if (asset.data.length > 64 * 1024 * 1024) throw new Error('Navigation asset is too large.');
	return Uint8Array.from(atob(asset.data), (c) => c.charCodeAt(0));
}

/** Per-stage navigation, lazily loading Recast only on bake or asset load. */
export class NavigationSession {
	private document: LevelDocument | null = null;
	private sourceHash = '';
	private generation = 0;
	private cancelWork: (() => void) | null = null;
	private mesh: NavigationMesh | null = null;
	private helper: Object3D | null = null;
	private overlay = new Group();
	private annotations = new Group();
	private route = new Group();
	private visible = false;
	private tool: NavigationToolPayload = { tool: 'none' };
	private firstPoint: BridgeVec3 | null = null;
	private state: NavigationStatus['state'] = 'empty';
	constructor(private host: NavigationSessionHost) {
		this.overlay.name = 'navigation-overlay';
		this.route.name = 'navigation-route';
		this.overlay.add(this.annotations, this.route);
	}
	get status(): NavigationStatus {
		return { stageId: this.host.stageId, sourceHash: this.sourceHash, state: this.state };
	}
	private publish(state: NavigationStatus['state'], message?: string, requestId?: string): void {
		this.state = state;
		this.host.status?.({ ...this.status, message, requestId });
	}
	private cancel(): number {
		this.generation++;
		this.cancelWork?.();
		this.cancelWork = null;
		return this.generation;
	}
	private releaseMesh(): void {
		if (this.helper) {
			clearGroup(this.helper);
			this.helper = null;
		}
		this.mesh?.dispose();
		this.mesh = null;
		clearGroup(this.route);
		this.overlay.add(this.route);
	}
	/** Selection and visibility syncs preserve the current bake. */
	sync(document: LevelDocument): void {
		const hash = navigationSourceHash(document);
		this.document = document;
		if (hash === this.sourceHash) return;
		this.cancel();
		this.releaseMesh();
		this.firstPoint = null;
		this.sourceHash = hash;
		this.drawAnnotations();
		const asset = document.navigation?.baked;
		if (asset && asset.sourceHash === hash) {
			// load publishes errors only while its generation is still current.
			void this.load(asset).catch(() => {});
		} else this.publish(asset ? 'stale' : 'empty');
	}
	setPreview(visible: boolean): void {
		this.visible = visible;
		this.overlay.visible = visible;
		const scene = this.host.scene();
		if (scene && this.overlay.parent !== scene) scene.add(this.overlay);
	}
	setTool(tool: NavigationToolPayload): void {
		this.tool = tool;
		this.firstPoint = null;
		// The canvas listeners attach only while the editor owns the pointer, and
		// arming one of these tools disarms the debug tool that would claim it.
		setNavigationToolArmed(tool.tool !== 'none');
		if (tool.tool !== 'none') this.setPreview(true);
	}
	/** Import a saved asset without running the generator. */
	async load(asset: NavigationAsset): Promise<void> {
		const token = this.cancel();
		this.releaseMesh();
		this.publish('building');
		try {
			if (this.document && navigationSourceHash(this.document) !== asset.sourceHash) {
				throw new Error('Navigation data is stale. Bake the current level again.');
			}
			const { NavigationMesh } = await import('./nav-mesh');
			const mesh = await NavigationMesh.load(decode(asset));
			if (token !== this.generation) {
				mesh.dispose();
				return;
			}
			this.releaseMesh();
			this.mesh = mesh;
			this.sourceHash = asset.sourceHash;
			this.helper = mesh.createHelper();
			this.overlay.add(this.helper);
			this.setPreview(this.visible);
			this.publish('ready');
		} catch (error) {
			if (token === this.generation)
				this.publish('error', error instanceof Error ? error.message : String(error));
			throw error;
		}
	}
	private async generate(input: NavigationBakeInput): Promise<Uint8Array> {
		if (typeof Worker === 'undefined') {
			const { bakeNavigationData } = await import('./bake');
			return bakeNavigationData(input);
		}
		return new Promise((resolve, reject) => {
			const worker = new Worker(new URL('./navigation-worker.js', import.meta.url), {
				type: 'module',
			});
			const finish = () => {
				clearTimeout(timeout);
				worker.terminate();
				this.cancelWork = null;
			};
			const timeout = setTimeout(() => {
				finish();
				reject(new Error('Navigation bake timed out. Increase cell size.'));
			}, 120_000);
			this.cancelWork = () => {
				finish();
				reject(new Error('Navigation bake cancelled.'));
			};
			worker.onmessage = ({ data }: MessageEvent<{ bytes?: Uint8Array; error?: string }>) => {
				finish();
				if (data.bytes) resolve(data.bytes);
				else reject(new Error(data.error ?? 'Navigation bake failed.'));
			};
			worker.onerror = () => {
				finish();
				reject(new Error('Navigation worker could not load. Check worker asset hosting and CSP.'));
			};
			try {
				worker.postMessage(input, [input.positions.buffer, input.indices.buffer]);
			} catch (error) {
				finish();
				reject(error);
			}
		});
	}
	async bake(requestId = 'runtime'): Promise<NavigationAsset | null> {
		if (!this.document) {
			this.publish('error', 'Open a level before baking.', requestId);
			return null;
		}
		const token = this.cancel();
		const document = this.document;
		const sourceHash = this.sourceHash;
		this.releaseMesh();
		this.publish('building', undefined, requestId);
		try {
			const engine = await import('./nav-mesh');
			if (token !== this.generation) return null;
			const sources = navigationSourceMeshes(document);
			let positions: Float32Array;
			let indices: Uint32Array;
			try {
				[positions, indices] = engine.getPositionsAndIndices(sources);
			} finally {
				disposeSourceMeshes(sources);
			}
			const navigation = JSON.parse(JSON.stringify(document.navigation ?? createLevelNavigation()));
			delete navigation.baked;
			const bytes = await this.generate({ positions, indices, navigation });
			if (token !== this.generation) return null;
			const mesh = await engine.NavigationMesh.load(bytes);
			if (token !== this.generation) {
				mesh.dispose();
				return null;
			}
			this.mesh = mesh;
			this.helper = mesh.createHelper();
			this.overlay.add(this.helper);
			this.setPreview(true);
			const asset: NavigationAsset = {
				version: 1,
				generator: NAVIGATION_GENERATOR,
				sourceHash,
				data: encode(bytes),
			};
			this.publish('ready', undefined, requestId);
			this.host.baked?.(requestId, asset);
			return asset;
		} catch (error) {
			if (token === this.generation)
				this.publish('error', error instanceof Error ? error.message : String(error), requestId);
			return null;
		}
	}
	findPath(start: BridgeVec3, end: BridgeVec3): NavigationPath {
		if (this.state !== 'ready' || !this.mesh) return { status: 'unreachable', points: [] };
		return this.mesh.findPath(start, end);
	}
	query(start: BridgeVec3, end: BridgeVec3, requestId?: string): NavigationPath {
		const result = this.findPath(start, end);
		clearGroup(this.route);
		this.overlay.add(this.route);
		if (result.points.length)
			this.route.add(
				this.line(result.points, result.status === 'complete' ? ROUTE_COMPLETE : ROUTE_PARTIAL)
			);
		this.setPreview(true);
		this.host.path?.(result, requestId);
		return result;
	}
	private line(points: BridgeVec3[], color: number): Line {
		const line = new Line(
			new BufferGeometry().setFromPoints(points.map((p) => new Vector3(p.x, p.y + 0.06, p.z))),
			// Transparent, and ordered after the overlay: the navmesh helper is a
			// transparent mesh, drawn after every opaque object, so an opaque line
			// that skips the depth test was painted first and then covered by it.
			new LineBasicMaterial({ color, depthTest: false, transparent: true })
		);
		line.renderOrder = ROUTE_RENDER_ORDER;
		return line;
	}
	private drawAnnotations(): void {
		clearGroup(this.annotations);
		this.overlay.add(this.annotations);
		for (const o of this.document?.navigation?.obstacles ?? [])
			this.annotations.add(
				new Box3Helper(
					new Box3(new Vector3(o.min.x, o.min.y, o.min.z), new Vector3(o.max.x, o.max.y, o.max.z)),
					0xff7043
				)
			);
		for (const l of this.document?.navigation?.links ?? []) {
			const start = new Vector3(l.start.x, l.start.y + 0.06, l.start.z);
			const end = new Vector3(l.end.x, l.end.y + 0.06, l.end.z);
			const direction = end.clone().sub(start);
			const length = direction.length();
			if (!length) continue;
			direction.normalize();
			this.annotations.add(new ArrowHelper(direction, start, length, 0x80deea));
			if (l.bidirectional)
				this.annotations.add(new ArrowHelper(direction.clone().negate(), end, length, 0x80deea));
		}
		this.setPreview(this.visible);
	}
	/** Two clicks on the level surface test a path, draw an obstacle, or create a link. */
	pointerDown(ray: { origin: Vector3; direction: Vector3 }): boolean {
		if (this.tool.tool === 'none' || !this.document) return false;
		let sources: ReturnType<typeof navigationSourceMeshes> = [];
		try {
			sources = navigationSourceMeshes(this.document);
			const hit = new Raycaster(ray.origin, ray.direction).intersectObjects(sources, false)[0];
			if (!hit) return true;
			const point = { x: hit.point.x, y: hit.point.y, z: hit.point.z };
			if (!this.firstPoint) {
				this.firstPoint = point;
				clearGroup(this.route);
				this.overlay.add(this.route);
				this.route.add(this.line([point, { ...point, y: point.y + 0.5 }], ROUTE_COMPLETE));
				return true;
			}
			const start = this.firstPoint;
			this.firstPoint = null;
			if (this.tool.tool === 'path') this.query(start, point);
			else if (this.tool.tool === 'link')
				this.host.edit?.({
					kind: 'link',
					link: {
						id: `link-${globalThis.crypto.randomUUID()}`,
						start,
						end: point,
						radius: this.document.navigation?.settings.agentRadius || 0.4,
						bidirectional: this.tool.bidirectional ?? true,
					},
				});
			else {
				const y = Math.min(start.y, point.y) - 0.1;
				const height = this.tool.obstacleHeight ?? 2;
				if (
					Math.abs(start.x - point.x) < 0.01 ||
					Math.abs(start.z - point.z) < 0.01 ||
					!Number.isFinite(height) ||
					height <= 0
				)
					return true;
				this.host.edit?.({
					kind: 'obstacle',
					obstacle: {
						id: `obstacle-${globalThis.crypto.randomUUID()}`,
						min: { x: Math.min(start.x, point.x), y, z: Math.min(start.z, point.z) },
						max: {
							x: Math.max(start.x, point.x),
							y: y + height + 0.1,
							z: Math.max(start.z, point.z),
						},
					},
				});
			}
		} catch (error) {
			this.publish('error', String(error));
		} finally {
			disposeSourceMeshes(sources);
		}
		return true;
	}
	clear(): void {
		this.cancel();
		this.releaseMesh();
		this.document = null;
		this.sourceHash = '';
		this.setTool({ tool: 'none' });
		clearGroup(this.annotations);
		this.overlay.add(this.annotations);
		this.overlay.removeFromParent();
		this.publish('empty');
	}
	dispose(): void {
		this.clear();
		clearGroup(this.overlay);
	}
}
