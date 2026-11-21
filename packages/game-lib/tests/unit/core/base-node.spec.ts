import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseNode } from '../../../src/lib/core/base-node';
import { SetupContext, UpdateContext, DestroyContext, LoadedContext, UnloadContext } from '../../../src/lib/core/base-node-life-cycle';
import { NodeInterface } from '../../../src/lib/core/node-interface';

class MockNode extends BaseNode {
    create() { return {}; }
    protected _setup(params: SetupContext<this>) { }
    protected _loaded(params: LoadedContext<this>) { }
    protected _update(params: UpdateContext<this>) { }
    protected _destroy(params: DestroyContext<this>) { }
    protected _unload(params: UnloadContext<this>) { }
}

describe('BaseNode', () => {
    let node: MockNode;

    beforeEach(() => {
        node = new MockNode();
    });

    it('should initialize with default values', () => {
        expect(node.uuid).toBeDefined();
        expect(node.getChildren()).toEqual([]);
        expect(node.getParent()).toBeNull();
    });

    it('should handle options in constructor', () => {
        const options = { foo: 'bar' };
        const nodeWithOptions = new MockNode([options]);
        expect(nodeWithOptions.options).toEqual(options);
    });

    it('should ignore BaseNode instances in constructor args for options', () => {
        const options = { foo: 'bar' };
        const otherNode = new MockNode();
        const nodeWithOptions = new MockNode([options, otherNode]);
        expect(nodeWithOptions.options).toEqual(options);
    });

    it('should allow setting and getting options', () => {
        const initialOptions = { foo: 'bar' };
        const nodeWithOptions = new MockNode([initialOptions]);

        expect(nodeWithOptions.getOptions()).toEqual(initialOptions);

        nodeWithOptions.setOptions({ foo: 'baz', baz: 'qux' });
        expect(nodeWithOptions.getOptions()).toEqual({ foo: 'baz', baz: 'qux' });
    });

    describe('Hierarchy', () => {
        it('should add a child', () => {
            const child = new MockNode();
            node.add(child);
            expect(node.getChildren()).toContain(child);
            expect(child.getParent()).toBe(node);
        });

        it('should remove a child', () => {
            const child = new MockNode();
            node.add(child);
            node.remove(child);
            expect(node.getChildren()).not.toContain(child);
            expect(child.getParent()).toBeNull();
        });

        it('should return true for isComposite if it has children', () => {
            const child = new MockNode();
            node.add(child);
            expect(node.isComposite()).toBe(true);
        });

        it('should accept any object implementing NodeInterface as child', () => {
            const child: NodeInterface = {
                uuid: 'interface-child',
                name: 'Interface Child',
                markedForRemoval: false,
                nodeSetup: vi.fn(),
                nodeUpdate: vi.fn(),
                nodeDestroy: vi.fn(),
                setParent: vi.fn(),
                getParent: vi.fn(),
            };

            node.add(child);
            expect(node.getChildren()).toContain(child);
            expect(child.setParent).toHaveBeenCalledWith(node);
        });
    });

    describe('Lifecycle', () => {
        it('should call _setup and run setup callbacks on nodeSetup', () => {
            const setupSpy = vi.spyOn(node as any, '_setup');
            const callbackSpy = vi.fn();
            node.onSetup(callbackSpy);
            const params = {} as any;

            node.nodeSetup(params);

            expect(setupSpy).toHaveBeenCalledWith(params);
            expect(callbackSpy).toHaveBeenCalledWith(params);
        });

        it('should call _update and run update callbacks on nodeUpdate', () => {
            const updateSpy = vi.spyOn(node as any, '_update');
            const callbackSpy = vi.fn();
            node.onUpdate(callbackSpy);
            const params = {} as any;

            node.nodeUpdate(params);

            expect(updateSpy).toHaveBeenCalledWith(params);
            expect(callbackSpy).toHaveBeenCalledWith(params);
        });

        it('should call _destroy and run destroy callbacks on nodeDestroy', () => {
            const destroySpy = vi.spyOn(node as any, '_destroy');
            const callbackSpy = vi.fn();
            node.onDestroy(callbackSpy);
            const params = {} as any;

            node.nodeDestroy(params);

            expect(destroySpy).toHaveBeenCalledWith(params);
            expect(callbackSpy).toHaveBeenCalledWith(params);
            expect(node.markedForRemoval).toBe(true);
        });

        it('should leave setup and update of children to the stage', () => {
            const child = new MockNode();
            const childSetupSpy = vi.spyOn(child as any, 'nodeSetup');
            const childUpdateSpy = vi.spyOn(child as any, 'nodeUpdate');

            node.add(child);
            const params = {} as any;

            node.nodeSetup(params);
            node.nodeUpdate(params);

            expect(childSetupSpy).not.toHaveBeenCalled();
            expect(childUpdateSpy).not.toHaveBeenCalled();
        });

        it('should destroy children with the child as `me`', () => {
            const child = new MockNode();
            const childDestroySpy = vi.spyOn(child as any, 'nodeDestroy');

            node.add(child);
            node.nodeDestroy({ me: node, globals: { score: 1 } } as any);

            expect(childDestroySpy).toHaveBeenCalledWith({ me: child, globals: { score: 1 } });
            expect(child.markedForRemoval).toBe(true);
        });

        it('should run loaded callbacks once per setup', () => {
            const loadedSpy = vi.spyOn(node as any, '_loaded');
            const callbackSpy = vi.fn();
            node.onLoaded(callbackSpy);
            const params = {} as any;

            node.nodeLoaded(params);
            node.nodeLoaded(params);
            expect(loadedSpy).toHaveBeenCalledTimes(1);
            expect(callbackSpy).toHaveBeenCalledTimes(1);

            node.nodeSetup(params);
            node.nodeLoaded(params);
            expect(callbackSpy).toHaveBeenCalledTimes(2);
        });

        it('should run unload callbacks after destroy callbacks', () => {
            const order: string[] = [];
            node.onUnload(() => order.push('unload'));
            node.onDestroy(() => order.push('destroy'));

            node.nodeDestroy({} as any);

            expect(order).toEqual(['destroy', 'unload']);
        });

        it('should keep onCleanup as an alias of onUnload', () => {
            const callbackSpy = vi.fn();
            node.onCleanup(callbackSpy);

            node.nodeDestroy({} as any);

            expect(callbackSpy).toHaveBeenCalledTimes(1);
        });

        it('should allocate a callback list only when a callback is registered', () => {
            const callbacks = (node as any).lifecycleCallbacks;
            expect(callbacks.update).toBeNull();

            node.onUpdate(() => { });
            expect(callbacks.update).toHaveLength(1);
            expect(callbacks.setup).toBeNull();
        });

        it('should run a callback registered by another callback in the same pass', () => {
            const late = vi.fn();
            node.onUpdate(() => { node.onUpdate(late); });

            node.nodeUpdate({} as any);

            expect(late).toHaveBeenCalledTimes(1);
        });
    });
});
