/**
 * Turns a navmesh route into steering.
 *
 * A route is waypoints, not movement. This walks down the list as each
 * waypoint is reached and says which way to head next. What moves the agent
 * is up to the caller. Here it is the platformer's input axes.
 */

export interface RoutePoint {
	x: number;
	y: number;
	z: number;
}

export interface Steering {
	/** Unit direction on the ground plane toward the next waypoint. */
	x: number;
	z: number;
	/** Ground distance left along the route, from the agent to the last waypoint. */
	remaining: number;
}

export class PathFollower {
	private route: RoutePoint[] = [];
	private next = 0;

	/** @param arrivalRadius Ground distance at which a waypoint counts as reached. */
	constructor(private readonly arrivalRadius = 0.3) {}

	/** Whether there is a waypoint left to reach. */
	get active(): boolean {
		return this.next < this.route.length;
	}

	/** Follow `points` from the first one. Replaces any route in progress. */
	setRoute(points: readonly RoutePoint[]): void {
		this.route = points.map((point) => ({ ...point }));
		this.next = 0;
	}

	clear(): void {
		this.route = [];
		this.next = 0;
	}

	/**
	 * Where to head from `position`.
	 *
	 * Waypoints are compared on the ground plane only: the agent's height above
	 * a waypoint depends on where its origin sits and on the slope under it.
	 *
	 * @returns `null` once the last waypoint is reached, or when there is no route.
	 */
	steer(position: RoutePoint): Steering | null {
		while (this.active) {
			const waypoint = this.route[this.next]!;
			const dx = waypoint.x - position.x;
			const dz = waypoint.z - position.z;
			const distance = Math.hypot(dx, dz);
			if (distance <= this.arrivalRadius || this.passed(dx, dz)) {
				this.next += 1;
				continue;
			}
			return {
				x: dx / distance,
				z: dz / distance,
				remaining: distance + this.lengthFrom(this.next),
			};
		}
		return null;
	}

	/**
	 * Whether the agent is beyond the next waypoint along the leg leading to it.
	 * A long frame can carry a running agent clean over the arrival radius.
	 *
	 * @param dx Offset from the agent to the waypoint.
	 * @param dz Offset from the agent to the waypoint.
	 */
	private passed(dx: number, dz: number): boolean {
		const previous = this.route[this.next - 1];
		if (!previous) return false;
		const waypoint = this.route[this.next]!;
		return dx * (waypoint.x - previous.x) + dz * (waypoint.z - previous.z) < 0;
	}

	/** Ground length of the route from waypoint `index` to the end. */
	private lengthFrom(index: number): number {
		let length = 0;
		for (let i = index + 1; i < this.route.length; i += 1) {
			const from = this.route[i - 1]!;
			const to = this.route[i]!;
			length += Math.hypot(to.x - from.x, to.z - from.z);
		}
		return length;
	}
}
