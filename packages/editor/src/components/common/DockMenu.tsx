import {
    createEffect,
    createSignal,
    For,
    onCleanup,
    Show,
    type Accessor,
    type Component,
} from 'solid-js';
import { Dynamic, Portal } from 'solid-js/web';
import { useLayer } from '@zylem/ui/components';
import { PanelBottom, PanelLeft, PanelRight, PanelTop } from 'lucide-solid';
import type { DockSide } from './dock-layout';

const DOCK_OPTIONS: Array<{
    side: DockSide;
    label: string;
    icon: typeof PanelLeft;
}> = [
    { side: 'left', label: 'Dock to left', icon: PanelLeft },
    { side: 'top', label: 'Dock to top', icon: PanelTop },
    { side: 'bottom', label: 'Dock to bottom', icon: PanelBottom },
    { side: 'right', label: 'Dock to right', icon: PanelRight },
];

export interface DockMenuProps {
    dockedSide: Accessor<DockSide | null>;
    onDock: (side: DockSide) => void;
}

/**
 * Chrome-DevTools-style dock picker for the panel titlebar: one trigger button
 * opening a row of dock-side options. Floating the panel is done by dragging it
 * away from an edge.
 *
 * The menu is portaled to the `menu` layer rather than positioned inside the
 * titlebar, because the panel clips its overflow — an inline menu was cut off at
 * the panel edge no matter what z-index it carried. Portaling costs us CSS
 * anchoring, so the position is measured from the trigger instead.
 */
export const DockMenu: Component<DockMenuProps> = (props) => {
    const [open, setOpen] = createSignal(false);
    const [anchor, setAnchor] = createSignal({ top: 0, right: 0 });
    const layer = useLayer('menu');
    let wrapperRef: HTMLDivElement | undefined;
    let triggerRef: HTMLButtonElement | undefined;
    let menuRef: HTMLDivElement | undefined;

    /**
     * The wrapper serves two purposes: it anchors the layer lookup, and it is the
     * subtree an outside-press test has to exclude. Assigned during render rather
     * than on mount, because `useLayer` resolves its container on mount and would
     * otherwise find no anchor.
     */
    const attachWrapper = (element: HTMLDivElement) => {
        wrapperRef = element;
        layer.anchorRef(element);
    };

    const triggerIcon = () =>
        DOCK_OPTIONS.find((option) => option.side === props.dockedSide())?.icon ?? PanelRight;

    /** Right-aligned under the trigger, matching where the inline menu sat. */
    const measure = () => {
        if (!triggerRef) return;
        const rect = triggerRef.getBoundingClientRect();
        setAnchor({
            top: rect.bottom + 6,
            right: Math.max(0, window.innerWidth - rect.right),
        });
    };

    const toggle = () => {
        if (!open()) measure();
        setOpen(!open());
    };

    // Close on pointerdown outside the menu. Membership is checked via
    // composedPath: the wrapper's stopPropagation runs in Solid's DELEGATED
    // handler, i.e. only once the native event has already reached the
    // document, so this same-node listener still fires for inside presses —
    // closing on those would unmount an option before its click can land. The
    // menu is portaled out of the wrapper, so it has to be tested separately.
    createEffect(() => {
        if (!open()) return;
        const onOutsidePointerDown = (event: PointerEvent) => {
            const path = event.composedPath();
            if (wrapperRef && path.includes(wrapperRef)) return;
            if (menuRef && path.includes(menuRef)) return;
            setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onOutsidePointerDown);
        document.addEventListener('keydown', onKeyDown);
        // A portaled menu no longer moves with its trigger, so re-measure rather
        // than leaving it stranded where the trigger used to be.
        window.addEventListener('resize', measure);
        onCleanup(() => {
            document.removeEventListener('pointerdown', onOutsidePointerDown);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', measure);
        });
    });

    return (
        <div
            ref={attachWrapper}
            style={{ display: 'inline-flex' }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                ref={triggerRef}
                class="floating-panel-button"
                title="Dock panel"
                aria-label="Dock panel"
                aria-haspopup="true"
                aria-expanded={open()}
                data-testid="dock-menu-trigger"
                onClick={toggle}
            >
                <Dynamic component={triggerIcon()} size={12} />
            </button>
            <Show when={open() && layer.mount()}>
                <Portal mount={layer.mount()!}>
                    <div
                        ref={menuRef}
                        role="menu"
                        aria-label="Dock panel to edge"
                        onPointerDown={(event) => event.stopPropagation()}
                        style={{
                            position: 'fixed',
                            top: `${anchor().top}px`,
                            right: `${anchor().right}px`,
                            display: 'flex',
                            gap: '6px',
                            padding: '6px',
                            'border-radius': '6px',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            background: 'rgba(10, 20, 30, 0.92)',
                            'box-shadow': '0 4px 14px rgba(0, 0, 0, 0.45)',
                            'z-index': layer.zIndex(),
                            // The editor overlay root is pointer-events: none.
                            'pointer-events': 'auto',
                        }}
                    >
                        <For each={DOCK_OPTIONS}>
                            {(option) => {
                                const active = () => props.dockedSide() === option.side;
                                return (
                                    <button
                                        type="button"
                                        role="menuitem"
                                        class="floating-panel-button"
                                        title={option.label}
                                        aria-label={option.label}
                                        data-testid={`dock-menu-${option.side}`}
                                        style={{
                                            'border-color': active()
                                                ? 'var(--zylem-color-primary, #61a6e8)'
                                                : undefined,
                                            background: active()
                                                ? 'rgba(97, 166, 232, 0.4)'
                                                : undefined,
                                        }}
                                        onClick={() => {
                                            props.onDock(option.side);
                                            setOpen(false);
                                        }}
                                    >
                                        <Dynamic component={option.icon} size={12} />
                                    </button>
                                );
                            }}
                        </For>
                    </div>
                </Portal>
            </Show>
        </div>
    );
};
