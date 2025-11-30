import { BaseNode } from '../base-node';
import { Stage } from '../../stage/stage';
import { GameEntity, GameEntityLifeCycle } from '../../entities/entity';
import { BaseGlobals, ZylemGameConfig } from '../../game/game-interfaces';
import { GameConfigLike } from '~/lib/game/game-config';

// export function isStageContext(value: unknown): value is StageContext {
// 	return !!value && typeof value === 'object' && 'instance' in (value as any) && 'stageBlueprint' in (value as any);
// }

export type GameOptions<TGlobals extends BaseGlobals> = Array<
	ZylemGameConfig<Stage, any, TGlobals> |
	GameConfigLike |
	Stage |
	GameEntityLifeCycle |
	BaseNode
>;

export async function convertNodes<TGlobals extends BaseGlobals>(
	_options: GameOptions<TGlobals>
): Promise<{ id: string, globals: TGlobals, stages: Stage[] }> {
	const { getGameDefaultConfig } = await import('../../game/game-default');
	let converted = { ...getGameDefaultConfig<TGlobals>() } as { id: string, globals: TGlobals, stages: Stage[] };
	const configurations: ZylemGameConfig<Stage, any, TGlobals>[] = [];
	const stages: Stage[] = [];
	const entities: (BaseNode | GameEntity<any>)[] = [];
	debugger;
	Object.values(_options).forEach((node) => {
		if (node instanceof Stage) {
			stages.push(node);
		} else if (node instanceof GameEntity) {
			entities.push(node);
		} else if (node instanceof BaseNode) {
			entities.push(node);
		} else if ((node as any)?.constructor?.name === 'Object' && typeof node === 'object') {
			const configuration = Object.assign({ ...getGameDefaultConfig<TGlobals>() }, { ...node });
			configurations.push(configuration as ZylemGameConfig<Stage, any, TGlobals>);
		}
	});
	configurations.forEach((configuration) => {
		converted = Object.assign(converted, { ...configuration });
	});
	stages.forEach((stageInstance) => {
		stageInstance.addEntities(entities as BaseNode[]);
	});
	if (stages.length) {
		converted.stages = stages;
	} else {
		converted.stages[0].addEntities(entities as BaseNode[]);
	}
	return converted as unknown as { id: string, globals: TGlobals, stages: Stage[] };
}

export function hasStages<TGlobals extends BaseGlobals>(_options: GameOptions<TGlobals>): Boolean {
	const stage = _options.find(option => option instanceof Stage);
	return Boolean(stage);
}