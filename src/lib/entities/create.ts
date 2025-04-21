import { EntityOptions } from "./entity";
import { BaseNode } from "../core/base-node";
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, GameEntity } from "./entity";

export interface CreateEntityOptions<T extends GameEntity<any>, CreateOptions extends EntityOptions> {
	args: Array<any>;
	defaultConfig: EntityOptions;
	BuilderClass: new (options: any, meshBuilder: any, collisionBuilder: any) => EntityBuilder<T, CreateOptions>;
	entityType: symbol;
	MeshBuilderClass?: new () => EntityMeshBuilder;
	CollisionBuilderClass?: new () => EntityCollisionBuilder;
};

export async function createEntity<T extends GameEntity<any>, CreateOptions extends EntityOptions>(params: CreateEntityOptions<T, CreateOptions>): Promise<T> {
	const { args, defaultConfig, BuilderClass, entityType, MeshBuilderClass, CollisionBuilderClass } = params;
	let builder: EntityBuilder<T, CreateOptions> | undefined;
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
		builder = new BuilderClass(
			arg,
			MeshBuilderClass ? new MeshBuilderClass() : undefined,
			CollisionBuilderClass ? new CollisionBuilderClass() : undefined,
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

