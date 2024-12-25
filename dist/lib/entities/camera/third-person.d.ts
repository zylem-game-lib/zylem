import { Vector3 } from 'three';
import { ZylemCamera } from '~/lib/core/camera';
declare const ThirdPersonCamera_base: import('ts-mixer/dist/types/types').Class<any[], ZylemCamera, typeof ZylemCamera>;
export declare class ThirdPersonCamera extends ThirdPersonCamera_base {
	distance: Vector3;
	setup(): void;
	update(): void;
}
export {};
