import { Constructor } from "./Composable";
export declare function Interactive<CBase extends Constructor>(Base: CBase): {
    new (...args: any[]): {
        [x: string]: any;
        setup(): void;
        destroy(): void;
        update(delta: number, { inputs, globals }: any): void;
        spawn(T: any, options: any): void;
    };
} & CBase;