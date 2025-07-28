import { CollisionContext, GameEntity } from "../../entities/entity";
import { MoveableEntity } from "../../behaviors/moveable";

export interface PingPongOptions {
	restitution: number;
	spinFactor: number;
	maxSpeed: number;
	minSpeed: number;
}

const defaultOptions: PingPongOptions = {
	restitution: 0.6,
	spinFactor: 0.5,
	maxSpeed: 15,
	minSpeed: 5
};

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
export function pingPong(
	options: Partial<PingPongOptions> = defaultOptions
) {
	return (collisionContext: CollisionContext<any, any>) => {
		_pingPong(collisionContext, options);
	};
}

function _pingPong(
	collisionContext: CollisionContext<MoveableEntity, GameEntity<any>>,
	options?: Partial<PingPongOptions>
) {
	const { entity, other } = collisionContext;
	if (other.collider?.isSensor()) return;

	const { restitution, spinFactor, maxSpeed, minSpeed } = { ...defaultOptions, ...options };

	const ballPos = entity.getPosition();
	const paddlePos = other.body?.translation();

	if (!ballPos || !paddlePos) return;

	const velocity = entity.getVelocity();
	if (!velocity) return;

	const normalX = ballPos.x > paddlePos.x ? 1 : -1;
	const normalY = 0;

	const paddleHeight = 2;
	const hitPosition = Math.max(-1, Math.min(1, (ballPos.y - paddlePos.y) / paddleHeight));

	const velocityDotNormal = velocity.x * normalX + velocity.y * normalY;
	let reflectedVelX = velocity.x - 2 * velocityDotNormal * normalX;
	let reflectedVelY = velocity.y - 2 * velocityDotNormal * normalY;

	reflectedVelY += hitPosition * spinFactor * Math.abs(reflectedVelX);

	reflectedVelX *= restitution;
	reflectedVelY *= restitution;

	const currentSpeed = Math.sqrt(reflectedVelX * reflectedVelX + reflectedVelY * reflectedVelY);
	if (currentSpeed < minSpeed) {
		const scale = minSpeed / currentSpeed;
		reflectedVelX *= scale;
		reflectedVelY *= scale;
	}

	if (currentSpeed > maxSpeed) {
		const scale = maxSpeed / currentSpeed;
		reflectedVelX *= scale;
		reflectedVelY *= scale;
	}

	const separation = 0.2;
	const newX = paddlePos.x + (normalX * separation);
	entity.setPosition(newX, ballPos.y, ballPos.z);

	entity.moveXY(reflectedVelX, reflectedVelY);
}
