import { BufferGeometry } from 'three';
declare class XZPlaneGeometry extends BufferGeometry {
    constructor(width?: number, height?: number, widthSegments?: number, heightSegments?: number);
    copy(source: any): this;
    static fromJSON(data: any): XZPlaneGeometry;
}
export { XZPlaneGeometry };
