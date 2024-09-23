import { ZylemHUD } from "../ui/hud";
import { ZylemCamera } from "./camera";
import { EntityOptions } from "./entity";
import { Game } from "./game-wrapper";

export interface LifecycleParameters<EntityType = any, GlobalsType = any> {
	game: Game; // TODO: this could be an interface
	delta: number; // TODO: this could be an interface
	inputs: any; // TODO: inputs type
	entity: EntityType;
	globals: GlobalsType;
	camera: ZylemCamera; // TODO: this could be an interface
	HUD: ZylemHUD; // TODO: this could be an interface
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

	lifecycleDefaults(options: EntityOptions<T>) {
		this._setup = options.setup || ((params) => { });
		this._update = options.update || ((params) => { });
		this._destroy = options.destroy || ((params) => { });
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