import { PerspectiveCamera, Vector3 } from 'three';
import type { ZylemCamera } from '../camera/zylem-camera';
import type { ZylemTransitionShader } from '../graphics/stage-transition';
import { CUTSCENE_BEHAVIOR_KEY, CutsceneCameraBehavior } from './cutscene-camera-behavior';
import type {
	AudioItem,
	CameraShot,
	CutsceneDefinition,
	CutsceneScene,
	EventItem,
	SceneTransition,
	SceneTransitionType,
	Vec3Def,
} from './cutscene-definition';
import { cutsceneLength, evaluateCutscene, itemsBetween, type EvaluatedPose } from './cutscene-math';

export type CutscenePlayerState = 'idle' | 'playing' | 'paused' | 'finished';

/**
 * What the player needs from the running game. `createStageCutsceneHost`
 * builds one from a live stage; tests and the editor can hand in stubs.
 */
export interface CutsceneHost {
	/** The camera the cutscene drives; resolved each frame so stage swaps are safe. */
	camera: () => ZylemCamera | null;
	/** World position of a named entity, for follow cameras and dolly look-ats. */
	entityPosition?: (name: string) => Vec3Def | undefined;
	playAnimation?: (entity: string, key: string) => void;
	/** Stage event dispatch (`emit` events). */
	dispatch?: (name: string, payload: Record<string, unknown>) => void;
	setVariable?: (name: string, value: unknown) => void;
	playSong?: (ref: string, options: { loop: boolean; volume: number }) => void;
	stopSong?: (ref?: string) => void;
	playSfx?: (url: string, options: { volume: number; loop: boolean }) => void;
	/**
	 * Runs a picture transition into the new scene: snapshot the current frame
	 * and blend it into the frames that follow. Omit to hard-cut everywhere.
	 */
	beginTransition?: (transition: SceneTransition, shader: ZylemTransitionShader | undefined) => void;
}

export interface CutscenePlayerOptions {
	host: CutsceneHost;
	/**
	 * `auto` (default) advances on `requestAnimationFrame`; `manual` leaves it
	 * to the caller's `update(dt)` — e.g. a stage `update` hook, so the
	 * cutscene pauses with the game.
	 */
	tick?: 'auto' | 'manual';
	/** Maps a transition type to a blend shader (e.g. `createStageTransition({ pattern }).shader`). */
	transitionShader?: (type: SceneTransitionType) => ZylemTransitionShader | undefined;
	/** Fire events/audio crossed by a `seek`. Off by default: scrubbing should not trigger gameplay. */
	fireEventsOnSeek?: boolean;
	timeScale?: number;
}

export interface CutscenePlayerEvents {
	time: (time: number) => void;
	state: (state: CutscenePlayerState) => void;
	scene: (scene: CutsceneScene | undefined) => void;
	shot: (shot: CameraShot | undefined) => void;
	event: (item: EventItem) => void;
	audio: (item: AudioItem) => void;
	complete: () => void;
	skip: () => void;
}

export interface CutscenePlayer {
	readonly definition: CutsceneDefinition;
	readonly state: CutscenePlayerState;
	/** Seconds. */
	readonly time: number;
	readonly length: number;
	/** The pose the picture shows right now, if a shot is active. */
	readonly pose: EvaluatedPose | undefined;
	play(from?: number): void;
	pause(): void;
	/** Stops, rewinds, and returns the camera to gameplay. */
	stop(): void;
	seek(time: number): void;
	/** Jumps to the end (when `skippable`) and completes. */
	skip(): boolean;
	/** Advances by `dt` seconds; only needed with `tick: 'manual'`. */
	update(dt: number): void;
	/** Swaps the definition in place, keeping time and state (live editing). */
	setDefinition(definition: CutsceneDefinition): void;
	on<K extends keyof CutscenePlayerEvents>(event: K, handler: CutscenePlayerEvents[K]): () => void;
	dispose(): void;
}

const EPSILON = 1e-6;

/**
 * Plays a cutscene against a live stage: drives the camera through a
 * pipeline behavior, fires event/audio items as the playhead crosses them,
 * and runs scene transitions through the renderer.
 *
 * ```ts
 * const player = createCutscenePlayer(INTRO_CUTSCENE, { host: createStageCutsceneHost(stage) });
 * player.on('complete', () => player.dispose());
 * player.play();
 * ```
 */
export function createCutscenePlayer(initial: CutsceneDefinition, options: CutscenePlayerOptions): CutscenePlayer {
	const { host } = options;
	const behavior = new CutsceneCameraBehavior();
	let definition = initial;
	let state: CutscenePlayerState = 'idle';
	let time = 0;
	let pose: EvaluatedPose | undefined;
	let currentSceneId: string | undefined;
	let currentShotId: string | undefined;
	let attachedCamera: ZylemCamera | null = null;
	let savedDamping = 0.15;
	let frame = 0;
	let lastStamp = 0;
	let disposed = false;

	const listeners: { [K in keyof CutscenePlayerEvents]: Set<CutscenePlayerEvents[K]> } = {
		time: new Set(),
		state: new Set(),
		scene: new Set(),
		shot: new Set(),
		event: new Set(),
		audio: new Set(),
		complete: new Set(),
		skip: new Set(),
	};

	const emit = <K extends keyof CutscenePlayerEvents>(event: K, ...args: Parameters<CutscenePlayerEvents[K]>) => {
		for (const handler of listeners[event]) {
			try {
				(handler as (...inner: unknown[]) => void)(...args);
			} catch (error) {
				console.error(`CutscenePlayer: ${event} listener failed`, error);
			}
		}
	};

	const setState = (next: CutscenePlayerState) => {
		if (state === next) return;
		state = next;
		emit('state', next);
	};

	// --- camera ----------------------------------------------------------------

	const attach = () => {
		const camera = host.camera();
		if (!camera || camera === attachedCamera) return;
		detach();
		attachedCamera = camera;
		savedDamping = camera.pipeline.damping;
		// Authored moves must land exactly; the pipeline's own smoothing would lag them.
		camera.pipeline.damping = 1;
		camera.pipeline.addBehavior(CUTSCENE_BEHAVIOR_KEY, behavior);
	};

	const detach = () => {
		if (!attachedCamera) return;
		attachedCamera.pipeline.removeBehavior(CUTSCENE_BEHAVIOR_KEY);
		attachedCamera.pipeline.damping = savedDamping;
		attachedCamera = null;
		behavior.setPose(null);
	};

	/** Writes the pose straight to the Three camera, for scrubbing while the game loop is paused. */
	const applyDirect = (next: EvaluatedPose) => {
		const camera = attachedCamera?.camera;
		if (!camera) return;
		camera.position.set(next.position.x, next.position.y, next.position.z);
		camera.lookAt(new Vector3(next.lookAt.x, next.lookAt.y, next.lookAt.z));
		if (camera instanceof PerspectiveCamera) {
			camera.fov = next.fov;
			camera.updateProjectionMatrix();
		}
	};

	const lookup = (name: string) => host.entityPosition?.(name);

	const refreshPicture = (refreshOptions: { snap?: boolean } = {}) => {
		attach();
		const frameState = evaluateCutscene(definition, time, lookup);
		pose = frameState.pose;
		const damping = frameState.camera?.kind === 'follow' ? Math.min(0.98, frameState.camera.damping) : 0;
		behavior.setPose(pose ?? null, damping);
		if (refreshOptions.snap) {
			behavior.snap();
			if (pose) applyDirect(pose);
		}
		if (frameState.shot?.id !== currentShotId) {
			currentShotId = frameState.shot?.id;
			emit('shot', frameState.shot);
		}
		return frameState;
	};

	// --- events ------------------------------------------------------------------

	const fireEvent = (item: EventItem) => {
		const { event } = item;
		try {
			switch (event.type) {
				case 'emit':
					host.dispatch?.(event.name, event.payload);
					break;
				case 'playAnimation':
					host.playAnimation?.(event.entity, event.key);
					break;
				case 'playSong':
					host.playSong?.(event.song, { loop: event.loop, volume: 0 });
					break;
				case 'stopSong':
					host.stopSong?.(event.song);
					break;
				case 'setVariable':
					host.setVariable?.(event.name, event.value);
					break;
				default:
					break;
			}
		} catch (error) {
			console.error('CutscenePlayer: event failed', item, error);
		}
		emit('event', item);
	};

	const fireAudio = (item: AudioItem) => {
		try {
			if (item.kind === 'song') host.playSong?.(item.ref, { loop: item.loop, volume: item.volume });
			else host.playSfx?.(item.ref, { volume: item.volume, loop: item.loop });
		} catch (error) {
			console.error('CutscenePlayer: audio failed', item, error);
		}
		emit('audio', item);
	};

	const fireBetween = (from: number, to: number) => {
		for (const track of definition.tracks) {
			if (track.kind === 'event') itemsBetween(track.items, from, to).forEach(fireEvent);
			else if (track.kind === 'audio') itemsBetween(track.items, from, to).forEach(fireAudio);
		}
	};

	const shaderFor = (type: SceneTransitionType): ZylemTransitionShader | undefined =>
		options.transitionShader?.(type);

	const enterScene = (scene: CutsceneScene | undefined, enterOptions: { transition: boolean }) => {
		if (scene?.id === currentSceneId) return;
		const previousId = currentSceneId;
		currentSceneId = scene?.id;
		// Only a scene reached by playing through (not the first, not a seek)
		// gets its picture transition.
		if (scene && enterOptions.transition && previousId !== undefined && scene.transitionIn.type !== 'cut') {
			host.beginTransition?.(scene.transitionIn, shaderFor(scene.transitionIn.type));
		}
		emit('scene', scene);
	};

	// --- transport -----------------------------------------------------------------

	const length = () => cutsceneLength(definition);

	const advance = (from: number, to: number, advanceOptions: { fireEvents: boolean; transitions: boolean }) => {
		time = Math.min(Math.max(0, to), length());
		// Transitions must be armed before the camera jumps, so the snapshot
		// shows the outgoing shot.
		const nextScene = evaluateCutscene(definition, time, lookup).scene;
		enterScene(nextScene, { transition: advanceOptions.transitions });
		refreshPicture({ snap: !advanceOptions.transitions });
		if (advanceOptions.fireEvents) fireBetween(from, time);
		emit('time', time);
		if (time >= length() - EPSILON && state === 'playing') finish();
	};

	const finish = () => {
		setState('finished');
		stopTicking();
		emit('complete');
	};

	const tick = (stamp: number) => {
		if (disposed || state !== 'playing') return;
		const dt = lastStamp ? Math.min(0.1, (stamp - lastStamp) / 1000) : 0;
		lastStamp = stamp;
		player.update(dt);
		if (state === 'playing') frame = requestAnimationFrame(tick);
	};

	const startTicking = () => {
		if (options.tick === 'manual' || typeof requestAnimationFrame !== 'function') return;
		cancelAnimationFrame(frame);
		lastStamp = 0;
		frame = requestAnimationFrame(tick);
	};

	const stopTicking = () => {
		if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frame);
		lastStamp = 0;
	};

	const player: CutscenePlayer = {
		get definition() {
			return definition;
		},
		get state() {
			return state;
		},
		get time() {
			return time;
		},
		get length() {
			return length();
		},
		get pose() {
			return pose;
		},
		play(from) {
			if (disposed) return;
			if (from !== undefined) {
				time = Math.min(Math.max(0, from), length());
				currentSceneId = undefined;
			}
			if (state === 'finished' && from === undefined) {
				time = 0;
				currentSceneId = undefined;
			}
			setState('playing');
			enterScene(evaluateCutscene(definition, time, lookup).scene, { transition: false });
			refreshPicture({ snap: true });
			emit('time', time);
			startTicking();
		},
		pause() {
			if (state !== 'playing') return;
			setState('paused');
			stopTicking();
		},
		stop() {
			stopTicking();
			time = 0;
			currentSceneId = undefined;
			currentShotId = undefined;
			pose = undefined;
			detach();
			setState('idle');
			emit('time', 0);
		},
		seek(target) {
			if (disposed) return;
			const from = time;
			advance(from, target, { fireEvents: Boolean(options.fireEventsOnSeek), transitions: false });
			if (state === 'idle' || state === 'finished') setState('paused');
		},
		skip() {
			if (!definition.skippable || disposed) return false;
			emit('skip');
			advance(time, length(), { fireEvents: false, transitions: false });
			if (state !== 'finished') finish();
			return true;
		},
		update(dt) {
			if (disposed || state !== 'playing') return;
			const scaled = dt * (options.timeScale ?? 1);
			if (scaled <= 0) {
				refreshPicture();
				return;
			}
			advance(time, time + scaled, { fireEvents: true, transitions: true });
		},
		setDefinition(next) {
			definition = next;
			if (state === 'idle') return;
			refreshPicture({ snap: state !== 'playing' });
		},
		on(event, handler) {
			listeners[event].add(handler);
			return () => listeners[event].delete(handler);
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			stopTicking();
			detach();
			for (const set of Object.values(listeners)) set.clear();
		},
	};

	return player;
}
