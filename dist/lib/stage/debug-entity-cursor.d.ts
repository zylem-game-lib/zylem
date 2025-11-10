import { Color, Object3D, Scene } from 'three';
/**
 * Debug overlay that displays an axis-aligned bounding box around a target Object3D.
 * Shows a semi-transparent fill plus a wireframe outline. Intended for SELECT/DELETE tools.
 */
export declare class DebugEntityCursor {
    private scene;
    private container;
    private fillMesh;
    private edgeLines;
    private currentColor;
    private bbox;
    private size;
    private center;
    constructor(scene: Scene);
    setColor(color: Color | number): void;
    /**
     * Update the cursor to enclose the provided Object3D using a world-space AABB.
     */
    updateFromObject(object: Object3D | null | undefined): void;
    hide(): void;
    dispose(): void;
}
//# sourceMappingURL=debug-entity-cursor.d.ts.map