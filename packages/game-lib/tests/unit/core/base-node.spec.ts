import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseNode } from '../../../src/lib/core/base-node';
import { SetupContext, UpdateContext, DestroyContext, LoadedContext, CleanupContext } from '../../../src/lib/core/base-node-life-cycle';
import { NodeInterface } from '../../../src/lib/core/node-interface';

class MockNode extends BaseNode {
    create() { return {}; }
    protected _setup(params: SetupContext<this>) { }
    protected _loaded(params: LoadedContext<this>) { return Promise.resolve(); }
    protected _update(params: UpdateContext<this>) { }
    protected _destroy(params: DestroyContext<this>) { }
    protected _cleanup(params: CleanupContext<this>) { }
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

        it('should propagate lifecycle events to children', () => {
            const child = new MockNode();
            const childSetupSpy = vi.spyOn(child as any, 'nodeSetup');
            const childUpdateSpy = vi.spyOn(child as any, 'nodeUpdate');
            const childDestroySpy = vi.spyOn(child as any, 'nodeDestroy');

            node.add(child);
            const params = {} as any;

            node.nodeSetup(params);
            expect(childSetupSpy).toHaveBeenCalledWith(params);

            node.nodeUpdate(params);
            expect(childUpdateSpy).toHaveBeenCalledWith(params);

            node.nodeDestroy(params);
            expect(childDestroySpy).toHaveBeenCalledWith(params);
        });
    });
});
