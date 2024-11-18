import { LifecycleFunction } from "../interfaces/entity";
import { ZylemHUD } from "../ui/hud";
import { ZylemCamera } from "./camera";
import { EntityOptions } from "./entity";
import { Game } from "./game-wrapper";

export interface LifecycleParameters<T = any> {
	game: Game; // TODO: this could be an interface
	delta: number; // TODO: this could be an interface
	inputs: any; // TODO: inputs type
	entity: T;
	globals: any;
	camera: ZylemCamera; // TODO: this could be an interface
	HUD: ZylemHUD; // TODO: this could be an interface
}

export interface LifecycleOptions<T> {
	setup: LifecycleFunction<T>;
	update: LifecycleFunction<T>;
	destroy: LifecycleFunction<T>;
}

export class Lifecycle<T> {
	_setup: (params: LifecycleParameters<T>) => void;
	_update: (params: LifecycleParameters<T>) => void;
	_destroy: (params: LifecycleParameters<T>) => void;

	constructor() {
		this._setup = () => {};
		this._update = () => {};
		this._destroy = () => {};
	}

	lifecycleDefaults(options: LifecycleOptions<T>) {
		this._setup = options.setup || (() => {});
		this._update = options.update || (() => {});
		this._destroy = options.destroy || (() => {});
	}

	setup(params: LifecycleParameters<T>){
		this._setup(params);
	};
	update(params: LifecycleParameters<T>) {
		this._update(params);
	};
	destroy(params: LifecycleParameters<T>) {
		this._destroy(params);
	};
}