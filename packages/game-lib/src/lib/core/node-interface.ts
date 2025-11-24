import {
    SetupContext,
    UpdateContext,
    DestroyContext,
} from "./base-node-life-cycle";

export interface NodeInterface {
    uuid: string;
    name: string;
    markedForRemoval: boolean;

    nodeSetup(params: SetupContext<any>): void;
    nodeUpdate(params: UpdateContext<any>): void;
    nodeDestroy(params: DestroyContext<any>): void;

    setParent(parent: NodeInterface | null): void;
    getParent(): NodeInterface | null;
}
