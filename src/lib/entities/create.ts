import { EntityOptions } from "./entity";
import { BaseNode } from "../core/base-node";
import { EntityBuilder, EntityCollisionBuilder, EntityMeshBuilder, GameEntity } from "./entity";


// Generic function to create entities
export async function createEntity<T extends GameEntity<any>, CreateOptions extends EntityOptions>(
	args: Array<any>,
	defaultConfig: CreateOptions,
	BuilderClass: new (options: any, meshBuilder: any, collisionBuilder: any) => EntityBuilder<T, CreateOptions>,
	MeshBuilderClass: new () => EntityMeshBuilder,
	CollisionBuilderClass: new () => EntityCollisionBuilder,
	entityType: symbol
): Promise<T> {
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
			new MeshBuilderClass(),
			new CollisionBuilderClass()
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

