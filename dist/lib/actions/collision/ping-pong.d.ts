import { CollisionContext } from "../../entities/entity";
export interface PingPongOptions {
    restitution: number;
    spinFactor: number;
    maxSpeed: number;
    minSpeed: number;
}
/**
 * Creates a realistic ricochet effect for ping-pong/ball physics
 * Takes into account the ball's current velocity and reflects it properly
 *
 * @param options Configuration options for the ricochet physics
 * @param options.restitution Energy retention factor (0 = no bounce, 1 = perfect bounce)
 * @param options.spinFactor How much the paddle position affects the ricochet angle
 * @param options.maxSpeed Maximum velocity the ball can achieve
 * @param options.minSpeed Minimum velocity to maintain game momentum
 */
export declare function pingPong(options?: Partial<PingPongOptions>): (collisionContext: CollisionContext<any, any>) => void;
