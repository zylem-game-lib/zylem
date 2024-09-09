import { IGameEntity } from "../core";

export function* entityGenerator(entities: IGameEntity[]): Generator<any, void, unknown> {
    for (const entity of entities) {
        yield entity;
    }
}

export function node(...args: any[]) {
	const generator = entityGenerator(args);
	const combined = [];
    for (const result of generator) {
        combined.push(result);
    }

	return combined;
}