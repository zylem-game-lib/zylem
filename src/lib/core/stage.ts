import { ZylemWorld } from "../collision/world";
import { ZylemScene } from "../rendering/scene";
import { GameEntityOptions } from "../interfaces/entity";
import { Conditions } from "../interfaces/game";
import { BufferAttribute, BufferGeometry, Color, LineBasicMaterial, LineSegments, PerspectiveCamera, Vector3 } from "three";
import {
	setStagePerspective,
	setStageBackgroundColor,
	setStageBackgroundImage,
	state$
} from "../state";
import { ZylemHUD } from "../ui/hud";
import { EntityParameters, GameEntity, IGameEntity } from "./";
import { World } from "@dimforge/rapier3d-compat";
import { Mixin } from "ts-mixer";
import { PerspectiveType, Perspectives } from "../interfaces/perspective";
import { ZylemBlueColor } from "../interfaces/utility";
import { BaseEntity } from "./base-entity";
import { debugState } from "../state/debug-state";

type ZylemStageOptions = {
	perspective: PerspectiveType;
	backgroundColor: Color;
	backgroundImage: String;
	gravity: Vector3;
	conditions: Conditions<any>[];
	children: ({ globals }: any) => IGameEntity[];
}

type StageOptions = GameEntityOptions<ZylemStageOptions, ZylemStage>;

export const STAGE_TYPE = 'Stage';

export class ZylemStage extends Mixin(BaseEntity) {
	public type = STAGE_TYPE;

	perspective: PerspectiveType;
	backgroundColor: Color;
	backgroundImage: String;
	gravity: Vector3;

	world: ZylemWorld | null;
	scene: ZylemScene | null;
	HUD: ZylemHUD;
	conditions: Conditions<any>[] = [];

	children: Array<IGameEntity> = [];
	_childrenMap: Map<string, IGameEntity> = new Map();
	_removalMap: Map<string, IGameEntity> = new Map();

	_debugLines: LineSegments | null = null;

	constructor(options: StageOptions) {
		super(options as GameEntityOptions<{}, unknown>);
		this.world = null;
		this.scene = null;
		this.HUD = new ZylemHUD();
		this.perspective = options.perspective ?? Perspectives.ThirdPerson;
		this.backgroundColor = options.backgroundColor ?? ZylemBlueColor;
		this.backgroundImage = options.backgroundImage ?? '';
		this.gravity = options.gravity ?? new Vector3(0, 0, 0);
		this.children = options.children ? options.children({ globals: state$.globals }) : [];
		this.conditions = options.conditions ?? [];

		const self = this;
		window.onresize = function () {
			self.resize(window.innerWidth, window.innerHeight);
		};
	}

	public async createFromBlueprint(): Promise<ZylemStage> {
		return Promise.resolve(this);
	}

	async buildStage(id: string) {
		// TODO: consider moving globals out
		setStagePerspective(this.perspective);
		setStageBackgroundColor(this.backgroundColor);
		setStageBackgroundImage(this.backgroundImage);

		this.scene = new ZylemScene(id);

		const physicsWorld = await ZylemWorld.loadPhysics(this.gravity ?? new Vector3(0, 0, 0));
		this.world = new ZylemWorld(physicsWorld);

		this.HUD.createUI();

		this.scene.setup();
		for (let child of this.children) {
			this.spawnEntity(child);
		}
	}

	public async setup(params: EntityParameters<ZylemStage>) {
		super.setup(params);
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		if (debugState.on) {
			this._debugLines = new LineSegments(
				new BufferGeometry(),
				new LineBasicMaterial({ vertexColors: true })
			);
			this.scene.scene.add(this._debugLines);
			this._debugLines.visible = true;
		}
		this._setup({ ...params, HUD: this.HUD });
	}

	public update(params: EntityParameters<ZylemStage>): void {
		super.update(params);
		const { delta } = params;
		if (!this.scene || !this.world) {
			this.logMissingEntities();
			return;
		}
		this.world.update(params);
		this._childrenMap.forEach((child, uuid) => {
			const needsRemoval = this._removalMap.get(uuid);
			if (needsRemoval) {
				this._childrenMap.delete(uuid);
				this._removalMap.delete(uuid);
				return;
			}
			child.update({
				...params,
				entity: child,
			});
		});
		if (this._update) {
			this._update({ ...params, entity: this });
		}
		this.scene.update({ delta });
		if (debugState.on) {
			this.debugStage(this.world.world);
		}
	}

	public destroy(params: EntityParameters<ZylemStage>): void {
		super.destroy(params);
		this.world?.destroy();
		this.scene?.destroy();
		this._destroy({ ...params, entity: this });
	}

	async spawnEntity(child: IGameEntity) {
		if (!this.scene || !this.world) {
			return;
		}

		const entity = await child.create();
		if (entity.group) {
			this.scene.scene.add(entity.group);
		}
		entity.stageRef = this;
		if (child._custom) {
			for (let key in child._custom) {
				if (entity[key]) { continue; }
				entity[key] = child._custom[key];
			}
		}
		this.world.addEntity(entity);
		child.setup({ entity, HUD: this.HUD, camera: this.scene.zylemCamera });
		this._childrenMap.set(entity.uuid, entity);
	}

	setForRemoval(entity: IGameEntity) {
		if (this.world) {
			this.world.setForRemoval(entity);
		}
		entity.group.clear();
		entity.group.removeFromParent();
		this._removalMap.set(entity.uuid, entity);
	}

	debugStage(world: World) {
		if (!this._debugLines) {
			return;
		}
		const { vertices, colors } = world.debugRender();
		this._debugLines.geometry.setAttribute(
			"position",
			new BufferAttribute(vertices, 3),
		);
		this._debugLines.geometry.setAttribute(
			"color",
			new BufferAttribute(colors, 4),
		);
	}

	getEntityByName(name: string) {
		const arr = Object.entries(Object.fromEntries(this._childrenMap)).map((entry) => entry[1]);
		const entity = arr.find((child) => child.name === name);
		if (!entity) {
			console.warn(`Entity ${name} not found`);
		}
		return entity ?? null;
	}

	logMissingEntities() {
		console.warn("Zylem world or scene is null");
	}

	resize(width: number, height: number) {
		if (this.scene) {
			const camera = this.scene.zylemCamera.camera as PerspectiveCamera;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			this.scene.updateRenderer(width, height);
		}
	}
}

export function stage(options: StageOptions = {}): ZylemStage {
	return new ZylemStage(options) as ZylemStage;
}