import type {
	PhysicsCommand,
	PhysicsEvent,
	PhysicsStepResultEvent,
	PhysicsAddBodyCommand,
	BodyCommand,
	CollisionPair,
	SerializableBodyDesc,
	SerializableColliderDesc,
	SerializableCharacterController,
} from './physics-protocol';
import { FLOATS_PER_BODY, TransformOffset } from './physics-protocol';
import { PhysicsBodyHandle } from './physics-body-handle';

/**
 * Callback signature for collision events dispatched by the proxy.
 */
export type CollisionCallback = (pair: CollisionPair) => void;

/**
 * Main-thread proxy that communicates with the physics Web Worker.
 *
 * Usage:
 * ```ts
 * const proxy = new PhysicsProxy();
 * await proxy.init([0, -9.81, 0], 60);
 * const handle = proxy.addBody(uuid, bodyDesc, colliderDescs);
 * // each frame:
 * await proxy.step(delta);
 * ```
 *
 * The proxy owns the worker lifecycle and manages body handles.
 * After each step, all handles are updated with fresh transform data
 * and collision callbacks are fired.
 */
export class PhysicsProxy {
	private worker: Worker | null = null;
	private handles = new Map<string, PhysicsBodyHandle>();
	private commandQueue: BodyCommand[] = [];
	private collisionListeners: CollisionCallback[] = [];
	private pendingStep: {
		resolve: (result: PhysicsStepResultEvent) => void;
		reject: (err: Error) => void;
	} | null = null;

	/** Latest interpolation alpha from the worker (0..1). */
	interpolationAlpha = 0;

	/**
	 * Spawn the worker and initialize the Rapier world inside it.
	 * Resolves when the worker reports `ready`.
	 *
	 * @param gravity World gravity as [x, y, z].
	 * @param physicsRate Physics tick rate in Hz (default 60).
	 * @param workerUrl URL to the physics worker script. The consuming
	 *   application must provide this because bundlers (Vite, Webpack)
	 *   can only resolve worker URLs from application source code.
	 *   Example for Vite:
	 *   ```ts
	 *   new URL('@zylem/game-lib/dist/physics-worker.js', import.meta.url)
	 *   ```
	 */
	async init(
		gravity: [number, number, number],
		physicsRate = 60,
		workerUrl?: URL,
	): Promise<void> {
		if (!workerUrl) {
			throw new Error(
				'[PhysicsProxy] workerUrl is required. Provide physicsWorkerUrl in your stage config.\n' +
				'For Vite: physicsWorkerUrl: new URL("@zylem/game-lib/dist/physics-worker.js", import.meta.url)'
			);
		}
		this.worker = new Worker(workerUrl, { type: 'module' });

		return new Promise<void>((resolve, reject) => {
			const onMessage = (e: MessageEvent<PhysicsEvent>) => {
				if (e.data.type === 'ready') {
					this.worker!.removeEventListener('message', onMessage);
					this.worker!.addEventListener('message', this.onWorkerMessage.bind(this));
					resolve();
				} else if (e.data.type === 'error') {
					reject(new Error(e.data.message));
				}
			};
			this.worker!.addEventListener('message', onMessage);

			this.send({ type: 'init', gravity, physicsRate });
		});
	}

	/**
	 * Register a body in the worker and return a main-thread handle.
	 *
	 * @returns A {@link PhysicsBodyHandle} for reading cached transforms
	 *   and queuing write commands.
	 */
	addBody(
		uuid: string,
		body: SerializableBodyDesc,
		colliders: SerializableColliderDesc[],
		characterController?: SerializableCharacterController,
	): PhysicsBodyHandle {
		const cmd: PhysicsAddBodyCommand = {
			type: 'addBody',
			uuid,
			body,
			colliders,
			characterController,
		};
		this.send(cmd);

		const handle = new PhysicsBodyHandle(uuid, this.commandQueue);
		handle._updateSnapshot(
			body.translation[0], body.translation[1], body.translation[2],
			0, 0, 0, 1,
			0, 0, 0,
			0, 0, 0,
		);
		this.handles.set(uuid, handle);
		return handle;
	}

	/** Remove a body from the worker and discard its handle. */
	removeBody(uuid: string): void {
		this.send({ type: 'removeBody', uuid });
		this.handles.delete(uuid);
	}

	/** Get a body handle by entity UUID. */
	getHandle(uuid: string): PhysicsBodyHandle | undefined {
		return this.handles.get(uuid);
	}

	/**
	 * Send a step command to the worker with the current frame delta
	 * and all queued body commands.
	 *
	 * Returns a promise that resolves after the worker replies with
	 * the step result. Handles are updated and collision callbacks
	 * are fired before the promise resolves.
	 */
	step(delta: number): Promise<PhysicsStepResultEvent> {
		return new Promise((resolve, reject) => {
			this.pendingStep = { resolve, reject };

			const commands = this.commandQueue.splice(0);

			for (const handle of this.handles.values()) {
				commands.push(...handle._drainCommands());
			}

			this.send({ type: 'step', delta, commands });
		});
	}

	/**
	 * Subscribe to collision events.
	 * @returns Unsubscribe function.
	 */
	onCollision(callback: CollisionCallback): () => void {
		this.collisionListeners.push(callback);
		return () => {
			this.collisionListeners = this.collisionListeners.filter((cb) => cb !== callback);
		};
	}

	/** Terminate the worker and release all handles. */
	dispose(): void {
		if (this.worker) {
			this.send({ type: 'dispose' });
			this.worker.terminate();
			this.worker = null;
		}
		this.handles.clear();
		this.commandQueue.length = 0;
		this.collisionListeners.length = 0;
		this.pendingStep = null;
	}

	// ─── Internal ────────────────────────────────────────────────────────

	private send(cmd: PhysicsCommand): void {
		this.worker?.postMessage(cmd);
	}

	private onWorkerMessage(e: MessageEvent<PhysicsEvent>): void {
		const event = e.data;

		switch (event.type) {
			case 'stepResult':
				this.applyStepResult(event);
				break;
			case 'error':
				if (this.pendingStep) {
					this.pendingStep.reject(new Error(event.message));
					this.pendingStep = null;
				} else {
					console.error('[PhysicsProxy] Worker error:', event.message);
				}
				break;
		}
	}

	private applyStepResult(result: PhysicsStepResultEvent): void {
		const { transforms, bodyOrder, collisions, interpolationAlpha } = result;
		this.interpolationAlpha = interpolationAlpha;

		for (let i = 0; i < bodyOrder.length; i++) {
			const handle = this.handles.get(bodyOrder[i]);
			if (!handle) continue;

			const o = i * FLOATS_PER_BODY;
			handle._updateSnapshot(
				transforms[o + TransformOffset.POS_X],
				transforms[o + TransformOffset.POS_Y],
				transforms[o + TransformOffset.POS_Z],
				transforms[o + TransformOffset.ROT_X],
				transforms[o + TransformOffset.ROT_Y],
				transforms[o + TransformOffset.ROT_Z],
				transforms[o + TransformOffset.ROT_W],
				transforms[o + TransformOffset.LINVEL_X],
				transforms[o + TransformOffset.LINVEL_Y],
				transforms[o + TransformOffset.LINVEL_Z],
				transforms[o + TransformOffset.ANGVEL_X],
				transforms[o + TransformOffset.ANGVEL_Y],
				transforms[o + TransformOffset.ANGVEL_Z],
			);
		}

		for (const pair of collisions) {
			for (const listener of this.collisionListeners) {
				try {
					listener(pair);
				} catch (err) {
					console.error('[PhysicsProxy] Collision listener error:', err);
				}
			}
		}

		if (this.pendingStep) {
			this.pendingStep.resolve(result);
			this.pendingStep = null;
		}
	}
}
