export declare function wait(delay: number, callback: Function): void;
export declare const actionOnPress: (isPressed: boolean, callback: Function) => void;
export declare const actionOnRelease: (isPressed: boolean, callback: Function) => void;
type CooldownOptions = {
    timer: number;
    immediate?: boolean;
};
export declare const actionWithCooldown: ({ timer, immediate }: CooldownOptions, callback: Function, update: Function) => void;
export declare const actionWithThrottle: (timer: number, callback: Function) => void;
export {};
//# sourceMappingURL=actions.d.ts.map