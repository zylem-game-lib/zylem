import {
    createEffect,
    createSignal,
    For,
    onCleanup,
    Show,
    type Accessor,
    type Component,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
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
 * opening a row of dock-side options. Rendered inline (no portal) so it stays
 * inside the editor's shadow DOM where the styles live. Floating the panel is
 * done by dragging it away from an edge.
 */
export const DockMenu: Component<DockMenuProps> = (props) => {
    const [open, setOpen] = createSignal(false);
    let wrapperRef: HTMLDivElement | undefined;

    const triggerIcon = () =>
        DOCK_OPTIONS.find((option) => option.side === props.dockedSide())?.icon ?? PanelRight;

    // Close on pointerdown outside the menu. Membership is checked via
    // composedPath: the wrapper's stopPropagation runs in Solid's DELEGATED
    // handler, i.e. only once the native event has already reached the
    // document, so this same-node listener still fires for inside presses —
    // closing on those would unmount an option before its click can land.
    createEffect(() => {
        if (!open()) return;
        const onOutsidePointerDown = (event: PointerEvent) => {
            if (wrapperRef && event.composedPath().includes(wrapperRef)) return;
            setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        document.addEventListener('pointerdown', onOutsidePointerDown);
        document.addEventListener('keydown', onKeyDown);
        onCleanup(() => {
            document.removeEventListener('pointerdown', onOutsidePointerDown);
            document.removeEventListener('keydown', onKeyDown);
        });
    });

    return (
        <div
            ref={wrapperRef}
            style={{ position: 'relative', display: 'inline-flex' }}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                class="floating-panel-button"
                title="Dock panel"
                aria-label="Dock panel"
                aria-haspopup="true"
                aria-expanded={open()}
                data-testid="dock-menu-trigger"
                onClick={() => setOpen(!open())}
            >
                <Dynamic component={triggerIcon()} size={12} />
            </button>
            <Show when={open()}>
                <div
                    role="menu"
                    aria-label="Dock panel to edge"
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: '0',
                        display: 'flex',
                        gap: '6px',
                        padding: '6px',
                        'border-radius': '6px',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        background: 'rgba(10, 20, 30, 0.92)',
                        'box-shadow': '0 4px 14px rgba(0, 0, 0, 0.45)',
                        'z-index': 30,
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
            </Show>
        </div>
    );
};
