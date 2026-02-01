import { createBox, createGame, createStage, makeTransformable } from "@zylem/game-lib";
import { Color } from "three";

const stage = createStage({ backgroundColor: new Color("#2e129f") });

// Grid configuration
const GRID_COLS = 4;
const SPACING = 5;
const BOX_SIZE = 1;
const ROTATION_SPEED = 2;
const MOVE_SPEED = 1;
const RESET_TIME = 2; // seconds

// Helper to create a box at a specific grid position
function createDemoBox(col: number, row: number, color: Color, label: string) {
    const x = (col - GRID_COLS / 2 + 0.5) * SPACING;
    const y = 1.5 - (1 - row) * SPACING;
    
    const box = makeTransformable(createBox({
        position: { x, y, z: 0 },
        size: { x: BOX_SIZE, y: BOX_SIZE, z: BOX_SIZE },
        color,
    }));
    
    // Store initial position for reset
    (box as any).initialPosition = { x, y, z: 0 };
    (box as any).resetTimer = 0;
    (box as any).label = label;
    
    return box;
}

// Row 0: Rotation X and Y demos
const rotateXPos = createDemoBox(0, 0, new Color("#ff6b6b"), "Rotate +X");
rotateXPos.onUpdate(({ me, delta }) => {
    me.rotateX(delta * ROTATION_SPEED);
});

const rotateXNeg = createDemoBox(1, 0, new Color("#ff8787"), "Rotate -X");
rotateXNeg.onUpdate(({ me, delta }) => {
    me.rotateX(-delta * ROTATION_SPEED);
});

const rotateYPos = createDemoBox(2, 0, new Color("#4ecdc4"), "Rotate +Y");
rotateYPos.onUpdate(({ me, delta }) => {
    me.rotateY(delta * ROTATION_SPEED);
});

const rotateYNeg = createDemoBox(3, 0, new Color("#6ee7de"), "Rotate -Y");
rotateYNeg.onUpdate(({ me, delta }) => {
    me.rotateY(-delta * ROTATION_SPEED);
});


// Row 1: Rotation Z and Movement X demos
const rotateZPos = createDemoBox(0, 1, new Color("#95e1d3"), "Rotate +Z");
rotateZPos.onUpdate(({ me, delta }) => {
    me.rotateZ(delta * ROTATION_SPEED);
});

const rotateZNeg = createDemoBox(1, 1, new Color("#b4f0e8"), "Rotate -Z");
rotateZNeg.onUpdate(({ me, delta }) => {
    me.rotateZ(-delta * ROTATION_SPEED);
});


const moveXPos = createDemoBox(2, 1, new Color("#f38181"), "Move +X");
moveXPos.onUpdate(({ me, delta }) => {
    const box = me as any;
    box.resetTimer += delta;
    
    if (box.resetTimer >= RESET_TIME) {
        // Reset position
        if (box.body) {
            box.body.setTranslation(box.initialPosition, true);
            box.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        box.resetTimer = 0;
    } else {
        me.moveX(MOVE_SPEED);
    }
});

const moveXNeg = createDemoBox(3, 1, new Color("#ffa5a5"), "Move -X");
moveXNeg.onUpdate(({ me, delta }) => {
    const box = me as any;
    box.resetTimer += delta;
    
    if (box.resetTimer >= RESET_TIME) {
        if (box.body) {
            box.body.setTranslation(box.initialPosition, true);
            box.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        box.resetTimer = 0;
    } else {
        me.moveX(-MOVE_SPEED);
    }
});


// Row 2: Movement Y and Z demos
const moveYPos = createDemoBox(0, 2, new Color("#a8e6cf"), "Move +Y");
moveYPos.onUpdate(({ me, delta }) => {
    const box = me as any;
    box.resetTimer += delta;
    
    if (box.resetTimer >= RESET_TIME) {
        if (box.body) {
            box.body.setTranslation(box.initialPosition, true);
            box.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        box.resetTimer = 0;
    } else {
        me.moveY(MOVE_SPEED);
    }
});

const moveYNeg = createDemoBox(1, 2, new Color("#c8f0e0"), "Move -Y");
moveYNeg.onUpdate(({ me, delta }) => {
    const box = me as any;
    box.resetTimer += delta;
    
    if (box.resetTimer >= RESET_TIME) {
        if (box.body) {
            box.body.setTranslation(box.initialPosition, true);
            box.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        box.resetTimer = 0;
    } else {
        me.moveY(-MOVE_SPEED);
    }
});

const moveZPos = createDemoBox(2, 2, new Color("#dcedc1"), "Move +Z");
moveZPos.onUpdate(({ me, delta }) => {
    const box = me as any;
    box.resetTimer += delta;
    
    if (box.resetTimer >= RESET_TIME) {
        if (box.body) {
            box.body.setTranslation(box.initialPosition, true);
            box.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        box.resetTimer = 0;
    } else {
        me.moveZ(MOVE_SPEED);
    }
});

const moveZNeg = createDemoBox(3, 2, new Color("#f0f4c3"), "Move -Z");
moveZNeg.onUpdate(({ me, delta }) => {
    const box = me as any;
    box.resetTimer += delta;
    
    if (box.resetTimer >= RESET_TIME) {
        if (box.body) {
            box.body.setTranslation(box.initialPosition, true);
            box.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        box.resetTimer = 0;
    } else {
        me.moveZ(-MOVE_SPEED);
    }
});

// Add all boxes to stage
stage.add(rotateXPos);
stage.add(rotateXNeg);
stage.add(rotateYPos);
stage.add(rotateYNeg);
stage.add(rotateZPos);
stage.add(rotateZNeg);
stage.add(moveXPos);
stage.add(moveXNeg);
stage.add(moveYPos);
stage.add(moveYNeg);
stage.add(moveZPos);
stage.add(moveZNeg);

const game = createGame(stage);

export default game;