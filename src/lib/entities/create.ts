import { DebugInfoBuilder, GameEntityOptions } from "./entity";
import { BaseNode } from "../core/base-node";
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, GameEntity } from "./entity";
import { EntityLoader, isLoadable } from "./delegates/loader";

export interface CreateGameEntityOptions<T extends GameEntity<any>, CreateOptions extends GameEntityOptions> {
	args: Array<any>;
	defaultConfig: GameEntityOptions;
	EntityClass: new (options: any) => T;
	BuilderClass: new (options: any, entity: T, meshBuilder: any, collisionBuilder: any, debugInfoBuilder: any) => EntityBuilder<T, CreateOptions>;
	MeshBuilderClass?: new (data: any) => EntityMeshBuilder;
	CollisionBuilderClass?: new (data: any) => EntityCollisionBuilder;
	DebugInfoBuilderClass?: new (data: any) => DebugInfoBuilder;
	entityType: symbol;
};

export async function createEntity<T extends GameEntity<any>, CreateOptions extends GameEntityOptions>(params: CreateGameEntityOptions<T, CreateOptions>): Promise<T> {
	const {
		args,
		defaultConfig,
		EntityClass,
		BuilderClass,
		entityType,
		MeshBuilderClass,
		CollisionBuilderClass,
		DebugInfoBuilderClass
	} = params;

	let builder: EntityBuilder<T, CreateOptions> | null = null;
	let configuration;

	const configurationIndex = args.findIndex(node => !(node instanceof BaseNode));
	if (configurationIndex !== -1) {
		const subArgs = args.splice(configurationIndex, 1);
		configuration = subArgs.find(node => !(node instanceof BaseNode));
	}

	const mergedConfiguration = configuration ? { ...defaultConfig, ...configuration } : defaultConfig;
	args.push(mergedConfiguration);

	for (const arg of args) {
		if (arg instanceof BaseNode) {
			continue;
		}
		let entityData = null;
		const entity = new EntityClass(arg);
		try {
			if (isLoadable(entity)) {
				const loader = new EntityLoader(entity);
				await loader.load();
				entityData = await loader.data();
			}
		} catch (error) {
			console.error("Error creating entity with loader:", error);
		}
		builder = new BuilderClass(
			arg,
			entity,
			MeshBuilderClass ? new MeshBuilderClass(entityData) : null,
			CollisionBuilderClass ? new CollisionBuilderClass(entityData) : null,
			DebugInfoBuilderClass ? new DebugInfoBuilderClass(entityData) : null
		);
		if (arg.material) {
			await builder.withMaterial(arg.material, entityType);
		}
	}

	if (!builder) {
		throw new Error(`missing options for ${String(entityType)}, builder is not initialized.`);
	}

	return await builder.build();
}

