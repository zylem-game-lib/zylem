import { BaseNode } from '../base-node';
import { DestroyFunction, SetupContext, SetupFunction, UpdateFunction } from '../base-node-life-cycle';
import { StageOptions, ZylemStage } from './zylem-stage';
import { ZylemCamera } from '../../camera/zylem-camera';
import { CameraWrapper } from '../../camera/camera';

export class Stage {
	stageRef: ZylemStage | null = null;
	options: StageOptions = [];

	update: UpdateFunction<ZylemStage> = () => { };
	setup: SetupFunction<ZylemStage> = () => { };
	destroy: DestroyFunction<ZylemStage> = () => { };

	constructor(options: StageOptions) {
		this.options = options;
	}

	async load(id: string, camera?: ZylemCamera | CameraWrapper | null) {
		this.stageRef = new ZylemStage(this.options);
		this.stageRef.wrapperRef = this;
		const zylemCamera = camera instanceof CameraWrapper ? camera.cameraRef : camera;

		await this.stageRef.load(id, zylemCamera);
	}

	async addEntities(entities: BaseNode[]) {
		this.options.push(...entities);
	}

	start(params: SetupContext<ZylemStage>) {
		this.stageRef?.setup(params);
	}
}

/**
 * Create a stage with optional camera
 */
export function stage(...options: StageOptions): Stage {
	return new Stage(options);
}