/** Input
 * 
 * Maximum number of local players is 8.
 * All input can be mapped to a gamepad or keyboard but shares the common
 * interface represented as a gamepad.
 */

export type InputPlayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type InputPlayer = `Player${InputPlayerNumber}`;

export interface InputGamepad<PlayerNumber extends InputPlayerNumber> {
	playerNumber: PlayerNumber;
	buttons: {
		A: boolean;
		B: boolean;
		X: boolean;
		Y: boolean;
		Start: boolean;
		Select: boolean;
		L: boolean;
		R: boolean;
	};
	directions: {
		Up: boolean;
		Down: boolean;
		Left: boolean;
		Right: boolean;
	};
	shoulders: {
		LTrigger: number;
		RTrigger: number;
	};
	axes: {
		Horizontal: number;
		Vertical: number;
	};
}

export interface Inputs {
	Player1: InputGamepad<1>;
	Player2: InputGamepad<2>;
	Player3: InputGamepad<3>;
	Player4: InputGamepad<4>;
	Player5: InputGamepad<5>;
	Player6: InputGamepad<6>;
	Player7: InputGamepad<7>;
	Player8: InputGamepad<8>;
}
