import { Button as KButton, Tooltip as KTooltip } from '@kobalte/core';
import { createSignal, onMount, Show, type Component, type JSX } from 'solid-js';

export interface ToolbarButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    children: JSX.Element;
}

/**
 * Editor toolbar button — same HyperGlass look as the @zylem/ui
 * ToolbarButton (identical `zylem-toolbar-btn` / `zylem-tooltip` classes),
 * but with the tooltip portaled into the editor's shadow root. The @zylem/ui
 * version portals into `document.body`, which sits outside the shadow tree
 * where the editor's injected styles don't apply, so the tooltip text
 * rendered unstyled/invisible.
 */
export const ToolbarButton: Component<ToolbarButtonProps> = (props) => {
    let markerRef: HTMLSpanElement | undefined;
    const [tooltipMount, setTooltipMount] = createSignal<ShadowRoot | HTMLElement>();

    onMount(() => {
        // Resolve after insertion so getRootNode() sees the shadow root.
        const root = markerRef?.getRootNode();
        setTooltipMount(root instanceof ShadowRoot ? root : document.body);
    });

    return (
        <>
            <span ref={markerRef} style={{ display: 'none' }} aria-hidden="true" />
            <KTooltip.Root openDelay={400}>
                <KTooltip.Trigger as="span">
                    <KButton.Root
                        aria-label={props.label}
                        onClick={() => props.onClick()}
                        class="zylem-toolbar-btn"
                        data-selected={props.isSelected ? '' : undefined}
                    >
                        {props.children}
                    </KButton.Root>
                </KTooltip.Trigger>
                <Show when={tooltipMount()}>
                    <KTooltip.Portal mount={tooltipMount()!}>
                        <KTooltip.Content class="zylem-tooltip">{props.label}</KTooltip.Content>
                    </KTooltip.Portal>
                </Show>
            </KTooltip.Root>
        </>
    );
};
