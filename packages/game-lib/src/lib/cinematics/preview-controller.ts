import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import type { CameraPosePayload, CutsceneLoadPayload, CutsceneStatusPayload, CutsceneViewPayload } from '@zylem/bridge';
import type { ZylemStage } from '../stage/zylem-stage';
import type { CutsceneDefinition } from './cutscene-definition';
import { createCutscenePlayer, type CutscenePlayer } from './cutscene-player';
import { createStageCutsceneHost, type StageCutsceneHostOptions } from './stage-host';

/**
 * Editor preview of a cutscene inside the running game: answers the bridge's
 * `cutscene:*` commands with a player bound to the current stage and reports
 * progress back. Owned by `ZylemGame`; Director mode drives it.
 */
export class CutscenePreviewController {
	private player: CutscenePlayer | null = null;
	private lastStatus: string | null = null;
	/** A load that arrived before the stage existed; replayed by `stageReady()`. */
	private pending: CutsceneLoadPayload | null = null;
	private readonly viewInverse = new Matrix4();
	private readonly viewProjection = new Matrix4();
	private lastView: string | null = null;

	constructor(
		private readonly getStage: () => ZylemStage | null,
		private readonly publish: (status: CutsceneStatusPayload) => void,
		private readonly hostOptions: StageCutsceneHostOptions = {},
		private readonly publishView?: (view: CutsceneViewPayload) => void,
	) {}

	get active(): boolean {
		return this.player !== null;
	}

	/**
	 * The game reports itself running before its first stage finishes loading,
	 * so an editor that loads a cutscene straight away would find no stage.
	 * The game calls this once a stage is up; a held load runs then.
	 */
	stageReady(): void {
		const payload = this.pending;
		if (!payload) return;
		this.pending = null;
		this.load(payload);
	}

	load(payload: CutsceneLoadPayload): void {
		const definition = payload.definition as unknown as CutsceneDefinition;
		if (!Array.isArray(definition?.tracks) || !Array.isArray(definition?.cameras)) {
			console.warn('CutscenePreview: ignoring malformed cutscene definition');
			return;
		}
		if (this.player && this.player.definition.id === definition.id) {
			this.player.setDefinition(definition);
		} else {
			this.unload();
			const stage = this.getStage();
			if (!stage) {
				this.pending = payload;
				return;
			}
			const player = createCutscenePlayer(definition, {
				host: createStageCutsceneHost(stage, this.hostOptions),
				fireEventsOnSeek: false,
			});
			player.on('time', () => this.report());
			player.on('state', () => this.report());
			player.on('shot', () => this.report());
			player.on('scene', () => this.report());
			this.player = player;
		}
		if (payload.time !== undefined) this.player.seek(payload.time);
		if (payload.autoplay) this.player.play(payload.time);
		this.report(true);
	}

	play(from?: number): void {
		this.player?.play(from);
	}

	pause(): void {
		this.player?.pause();
	}

	stop(): void {
		this.player?.stop();
	}

	seek(time: number): void {
		this.player?.seek(time);
	}

	/** Drops the player because its stage is going away; a held load survives for the next stage. */
	releaseStage(): void {
		if (!this.player) return;
		this.player.dispose();
		this.player = null;
		this.lastView = null;
		this.report(true);
	}

	/**
	 * Once per rendered frame while a cutscene is loaded: publishes the
	 * camera's projection and the canvas box when either changed, so the
	 * editor's overlays track the view without polling.
	 */
	frame(): void {
		if (!this.player || !this.publishView) return;
		const stage = this.getStage();
		const camera = stage?.cameraRef?.camera;
		const canvas: HTMLCanvasElement | undefined =
			stage?.rendererManager?.getDomElement() ?? stage?.cameraRef?.renderer?.domElement;
		if (!camera || !canvas) return;
		camera.updateMatrixWorld();
		this.viewInverse.copy(camera.matrixWorld).invert();
		this.viewProjection.multiplyMatrices(camera.projectionMatrix, this.viewInverse);
		const rect = canvas.getBoundingClientRect();
		const view: CutsceneViewPayload = {
			viewProjection: this.viewProjection.toArray(),
			inverseViewProjection: [],
			viewport: {
				x: Math.round(rect.left),
				y: Math.round(rect.top),
				width: Math.round(rect.width),
				height: Math.round(rect.height),
			},
		};
		const key = JSON.stringify(view);
		if (key === this.lastView) return;
		this.lastView = key;
		view.inverseViewProjection = this.viewProjection.clone().invert().toArray();
		this.publishView(view);
	}

	unload(): void {
		this.pending = null;
		this.releaseStage();
	}

	/** The live camera as position + look-at, for "capture from viewport". */
	cameraPose(): Omit<CameraPosePayload, 'requestId'> | null {
		const camera = this.getStage()?.cameraRef?.camera;
		if (!camera) return null;
		const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
		// Aim at the point along the view ray at the distance of the current
		// pipeline look-at when there is one, else a sensible 10 units out.
		const lookAt = camera.position.clone().add(forward.multiplyScalar(10));
		return {
			position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
			lookAt: { x: lookAt.x, y: lookAt.y, z: lookAt.z },
			fov: camera instanceof PerspectiveCamera ? camera.fov : undefined,
		};
	}

	private report(force = false): void {
		const player = this.player;
		const status: CutsceneStatusPayload = player
			? {
					cutsceneId: player.definition.id,
					state: player.state,
					time: Math.round(player.time * 1000) / 1000,
					sceneId: null,
					shotId: null,
				}
			: { cutsceneId: null, state: 'idle', time: 0, sceneId: null, shotId: null };
		if (player) {
			const frame = evaluateIds(player);
			status.sceneId = frame.sceneId;
			status.shotId = frame.shotId;
		}
		const key = JSON.stringify(status);
		if (!force && key === this.lastStatus) return;
		this.lastStatus = key;
		this.publish(status);
	}
}

function evaluateIds(player: CutscenePlayer): { sceneId: string | null; shotId: string | null } {
	const { definition, time } = player;
	let sceneId: string | null = null;
	for (const scene of definition.scenes) {
		if (time >= scene.start && time < scene.end) sceneId = scene.id;
	}
	let shotId: string | null = null;
	for (const track of definition.tracks) {
		if (track.kind !== 'camera' || shotId) continue;
		for (const shot of track.items) {
			if (time >= shot.start && time < shot.end) shotId = shot.id;
		}
	}
	return { sceneId, shotId };
}
