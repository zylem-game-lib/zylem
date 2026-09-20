import { Howl } from 'howler';
import type { Object3D } from 'three';
import { resolveStageTransition, type ZylemTransitionShader } from '../graphics/stage-transition';
import type { ZylemStage } from '../stage/zylem-stage';
import type { Stage } from '../stage/stage';
import type { CutsceneHost } from './cutscene-player';
import type { SceneTransition, SceneTransitionType, Vec3Def } from './cutscene-definition';
import type { SongDefinition } from '../audio/song-definition';
import { songLengthBeats } from '../audio/song-math';
import type { SongPlayer } from '../audio/song-player';

export interface StageCutsceneHostOptions {
	/**
	 * Looks a song reference (slug or URL from a `playSong` event / audio
	 * item) up to a definition the audio module can play. Without it song
	 * items are ignored.
	 */
	resolveSong?: (ref: string) => SongDefinition | Promise<SongDefinition | undefined> | undefined;
	/** Maps a transition type to a blend shader; defaults to a crossfade for every type. */
	transitionShader?: (type: SceneTransitionType) => ZylemTransitionShader | undefined;
	/** Called for `emit` events in addition to the stage dispatch. */
	onEvent?: (name: string, payload: Record<string, unknown>) => void;
}

let defaultTransitionShaders: ((type: SceneTransitionType) => ZylemTransitionShader | undefined) | null = null;

/**
 * Registers the blend shaders every stage-bound cutscene uses for its scene
 * transitions, typically once at startup:
 *
 * ```ts
 * import { createStageTransition } from '@zylem/shaders';
 * setCutsceneTransitionShaders((type) => createStageTransition({ pattern: type }).shader);
 * ```
 *
 * Without this, every non-`cut` transition is a plain crossfade.
 */
export function setCutsceneTransitionShaders(
	resolver: ((type: SceneTransitionType) => ZylemTransitionShader | undefined) | null,
): void {
	defaultTransitionShaders = resolver;
}

function toStage(stage: ZylemStage | Stage): ZylemStage | null {
	return 'wrappedStage' in stage ? stage.wrappedStage : stage;
}

function positionOf(node: { group?: Object3D; mesh?: Object3D | null } | null): Vec3Def | undefined {
	const object = node?.group ?? node?.mesh;
	if (!object) return undefined;
	return { x: object.position.x, y: object.position.y, z: object.position.z };
}

/**
 * A `CutsceneHost` bound to a live stage: drives the stage camera, resolves
 * entities by name, dispatches stage events, writes stage variables, plays
 * songs through `@zylem/game-lib/audio` (loaded on demand) and one-shots
 * through Howler, and runs scene transitions on the stage renderer.
 */
/** What a stage-bound cutscene plays on: the public `Stage` wrapper or the internal stage. */
export type CutsceneStageLike = ZylemStage | Stage;

export function createStageCutsceneHost(
	stageLike: CutsceneStageLike,
	options: StageCutsceneHostOptions = {},
): CutsceneHost {
	const stage = () => toStage(stageLike);
	const songs = new Map<string, SongPlayer>();
	const sounds = new Set<Howl>();

	const stopSong = (ref?: string) => {
		for (const [key, player] of songs) {
			if (ref !== undefined && key !== ref) continue;
			player.stop();
			player.dispose();
			songs.delete(key);
		}
	};

	return {
		camera: () => stage()?.cameraRef ?? null,
		entityPosition: (name) => positionOf(stage()?.getEntityByName(name) as { group?: Object3D } | null),
		playAnimation: (name, key) => {
			const entity = stage()?.getEntityByName(name) as { playAnimation?: (opts: { key: string }) => void } | null;
			entity?.playAnimation?.({ key });
		},
		dispatch: (name, payload) => {
			options.onEvent?.(name, payload);
			(stage()?.wrapperRef as { dispatch?: (event: string, payload: unknown) => void } | null)?.dispatch?.(
				name,
				payload,
			);
		},
		setVariable: (name, value) => {
			const state = stage()?.state;
			if (state) state.variables[name] = value;
		},
		playSong: (ref, { loop, volume }) => {
			if (!options.resolveSong) return;
			void (async () => {
				const definition = await options.resolveSong!(ref);
				if (!definition) return;
				const audio = await import('../audio/song-player');
				stopSong(ref);
				const player = audio.createSongPlayer({
					...definition,
					loop: loop ? { enabled: true, start: 0, end: songLengthBeats(definition) } : definition.loop,
					masterVolume: (definition.masterVolume ?? 0) + volume,
				});
				songs.set(ref, player);
				await player.play();
			})().catch((error: unknown) => console.error('Cutscene: could not play song', ref, error));
		},
		stopSong,
		playSfx: (url, { volume, loop }) => {
			const sound = new Howl({ src: [url], volume: Math.pow(10, volume / 20), loop, html5: true });
			sounds.add(sound);
			sound.once('end', () => {
				if (!loop) sounds.delete(sound);
			});
			sound.play();
		},
		beginTransition: (transition: SceneTransition, shader) => {
			const current = stage();
			const renderer = current?.rendererManager;
			const scene = current?.scene?.scene;
			const camera = current?.cameraRef?.camera;
			if (!renderer || !scene || !camera) return;
			renderer.beginInStageTransition(
				resolveStageTransition({
					duration: transition.duration,
					easing: transition.easing === 'linear' ? 'linear' : 'easeInOut',
					shader:
						shader
						?? options.transitionShader?.(transition.type)
						?? defaultTransitionShaders?.(transition.type),
				}),
				scene,
				camera,
			);
		},
	};
}
