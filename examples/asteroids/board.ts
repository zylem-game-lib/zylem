export const boardWidth = 25;
export const boardHeight = 12.5;

export function wrapAroundBoard(posX: number, posY: number) {
	if (posX > boardWidth) {
		posX = -boardWidth;
	} else if (posX < -boardWidth) {
		posX = boardWidth;
	}
	if (posY > boardHeight) {
		posY = -boardHeight;
	} else if (posY < -boardHeight) {
		posY = boardHeight;
	}
	return { newPosX: posX, newPosY:posY };
}