import { createSignal, Show, type Accessor, type Component, type Setter } from 'solid-js';
import { Portal } from 'solid-js/web';

const SNAP_PREVIEW_THRESHOLD = 24;

export interface PanelPosition {
    x: number;
    y: number;
}

export interface PanelSize {
    width: number;
    height: number;
}

export type DockSide = 'left' | 'right';

export interface DockRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface DockPreviewState {
    visible: boolean;
    side: DockSide | null;
}

interface FittedPanel {
    position: PanelPosition;
    size: PanelSize;
}

interface CreatePanelDockingOptions {
    initialSize: PanelSize;
    minSize: PanelSize;
    position: Accessor<PanelPosition>;
    setPosition: Setter<PanelPosition>;
    size: Accessor<PanelSize>;
    setSize: Setter<PanelSize>;
    panelRef: Accessor<HTMLDivElement | undefined>;
    onPositionCommit?: (position: PanelPosition) => void;
    onSizeCommit?: (size: PanelSize) => void;
}

/**
 * Shares the panel docking state and viewport-fitting behavior between
 * floating editor panels so drag, dock, undock, and resize logic stays aligned.
 */
export function createPanelDocking(options: CreatePanelDockingOptions) {
    const [undockedSize, setUndockedSize] = createSignal<PanelSize>({
        width: options.initialSize.width,
        height: options.initialSize.height,
    });
    const [isAutoHeight, setIsAutoHeight] = createSignal(true);
    const [dockedSide, setDockedSide] = createSignal<DockSide | null>(null);
    const [dockPreview, setDockPreview] = createSignal<DockPreviewState>({
        visible: false,
        side: null,
    });
    let resizeRaf: number | undefined;

    const showDockPreview = (side: DockSide) => {
        setDockPreview({ visible: true, side });
    };

    const hideDockPreview = () => {
        setDockPreview({ visible: false, side: null });
    };

    const rememberUndockedSize = (nextSize: PanelSize) => {
        setUndockedSize({ width: nextSize.width, height: nextSize.height });
    };

    const getLiveSize = () => {
        const panelElement = options.panelRef();
        if (panelElement) {
            const rect = panelElement.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
        }
        return options.size();
    };

    const getDockRect = (side: DockSide): DockRect => {
        const quarterWidth = Math.max(1, Math.round(window.innerWidth / 4));
        if (side === 'left') {
            return { x: 0, y: 0, width: quarterWidth, height: window.innerHeight };
        }
        return {
            x: Math.max(0, window.innerWidth - quarterWidth),
            y: 0,
            width: quarterWidth,
            height: window.innerHeight,
        };
    };

    const getDockPreviewRect = (): DockRect | null => {
        const preview = dockPreview();
        if (!preview.visible || !preview.side) return null;
        return getDockRect(preview.side);
    };

    const clampSizeToViewport = (width: number, height: number): PanelSize => {
        const maxWidth = Math.max(1, window.innerWidth);
        const maxHeight = Math.max(1, window.innerHeight);
        const minWidth = Math.min(options.minSize.width, maxWidth);
        const minHeight = Math.min(options.minSize.height, maxHeight);
        return {
            width: Math.min(maxWidth, Math.max(minWidth, width)),
            height: Math.min(maxHeight, Math.max(minHeight, height)),
        };
    };

    const fitPanelToViewport = (
        currentX: number,
        currentY: number,
        currentWidth: number,
        currentHeight: number,
    ): FittedPanel => {
        const fittedSize = clampSizeToViewport(currentWidth, currentHeight);
        const maxX = Math.max(0, window.innerWidth - fittedSize.width);
        const maxY = Math.max(0, window.innerHeight - fittedSize.height);
        return {
            position: {
                x: Math.max(0, Math.min(currentX, maxX)),
                y: Math.max(0, Math.min(currentY, maxY)),
            },
            size: fittedSize,
        };
    };

    const detectDockSide = (
        x: number,
        y: number,
        width: number,
        height: number,
    ): DockSide | null => {
        const leftOverflow = Math.max(0, -x);
        const rightOverflow = Math.max(0, x + width - window.innerWidth);
        const topOverflow = Math.max(0, -y);
        const bottomOverflow = Math.max(0, y + height - window.innerHeight);

        if (leftOverflow >= SNAP_PREVIEW_THRESHOLD || rightOverflow >= SNAP_PREVIEW_THRESHOLD) {
            return leftOverflow >= rightOverflow ? 'left' : 'right';
        }

        if (topOverflow >= SNAP_PREVIEW_THRESHOLD || bottomOverflow >= SNAP_PREVIEW_THRESHOLD) {
            const panelCenterX = x + width / 2;
            return panelCenterX <= window.innerWidth / 2 ? 'left' : 'right';
        }

        return null;
    };

    const undockFromDrag = (pointerX: number, pointerY: number): FittedPanel => {
        const preferred = undockedSize();
        const restored = clampSizeToViewport(preferred.width, preferred.height);
        const currentPos = options.position();
        const currentSize = getLiveSize();
        const pointerRatioX = currentSize.width > 0
            ? Math.max(0, Math.min(1, (pointerX - currentPos.x) / currentSize.width))
            : 0;
        const pointerRatioY = currentSize.height > 0
            ? Math.max(0, Math.min(1, (pointerY - currentPos.y) / currentSize.height))
            : 0;
        const fitted = fitPanelToViewport(
            pointerX - restored.width * pointerRatioX,
            pointerY - restored.height * pointerRatioY,
            restored.width,
            restored.height,
        );

        options.setSize(fitted.size);
        options.setPosition(fitted.position);
        setDockedSide(null);
        setIsAutoHeight(true);
        hideDockPreview();
        return fitted;
    };

    const beginResize = () => {
        hideDockPreview();
        setDockedSide(null);
        const currentSize = getLiveSize();
        options.setSize(currentSize);
        setIsAutoHeight(false);
        return currentSize;
    };

    const clearDockedSide = () => {
        setDockedSide(null);
    };

    const applyDockPreview = () => {
        const previewRect = getDockPreviewRect();
        const preview = dockPreview();
        if (!previewRect || !preview.side) return null;

        if (dockedSide() === null) {
            rememberUndockedSize(options.size());
        }

        const nextPosition = { x: previewRect.x, y: previewRect.y };
        const nextSize = { width: previewRect.width, height: previewRect.height };
        options.setPosition(nextPosition);
        options.setSize(nextSize);
        setDockedSide(preview.side);
        setIsAutoHeight(false);
        options.onPositionCommit?.(nextPosition);
        options.onSizeCommit?.(nextSize);
        return { side: preview.side, rect: previewRect };
    };

    const restoreUndockedPanel = (): FittedPanel => {
        const preferred = undockedSize();
        const restored = clampSizeToViewport(preferred.width, preferred.height);
        const currentPos = options.position();
        const fitted = fitPanelToViewport(
            currentPos.x,
            currentPos.y,
            restored.width,
            restored.height,
        );

        options.setSize(fitted.size);
        options.setPosition(fitted.position);
        setDockedSide(null);
        setIsAutoHeight(true);
        options.onSizeCommit?.(fitted.size);
        options.onPositionCommit?.(fitted.position);
        return fitted;
    };

    const handleWindowResize = () => {
        if (resizeRaf !== undefined) {
            cancelAnimationFrame(resizeRaf);
        }

        resizeRaf = requestAnimationFrame(() => {
            const side = dockedSide();
            if (side) {
                const dockRect = getDockRect(side);
                const currentPos = options.position();
                const currentSize = options.size();
                if (
                    currentPos.x !== dockRect.x
                    || currentPos.y !== dockRect.y
                    || currentSize.width !== dockRect.width
                    || currentSize.height !== dockRect.height
                ) {
                    const nextPosition = { x: dockRect.x, y: dockRect.y };
                    const nextSize = { width: dockRect.width, height: dockRect.height };
                    options.setPosition(nextPosition);
                    options.setSize(nextSize);
                    options.onPositionCommit?.(nextPosition);
                    options.onSizeCommit?.(nextSize);
                }
            } else {
                const currentPos = options.position();
                const currentSize = isAutoHeight() ? getLiveSize() : options.size();
                const fitted = fitPanelToViewport(
                    currentPos.x,
                    currentPos.y,
                    currentSize.width,
                    currentSize.height,
                );

                const sizeChanged =
                    currentSize.width !== fitted.size.width
                    || currentSize.height !== fitted.size.height;
                const posChanged =
                    currentPos.x !== fitted.position.x || currentPos.y !== fitted.position.y;

                if (sizeChanged) {
                    options.setSize(fitted.size);
                    options.onSizeCommit?.(fitted.size);
                }
                if (posChanged) {
                    options.setPosition(fitted.position);
                    options.onPositionCommit?.(fitted.position);
                }
            }

            resizeRaf = undefined;
        });
    };

    const cleanupWindowResize = () => {
        if (resizeRaf !== undefined) {
            cancelAnimationFrame(resizeRaf);
            resizeRaf = undefined;
        }
    };

    return {
        dockedSide,
        isAutoHeight,
        showDockPreview,
        hideDockPreview,
        rememberUndockedSize,
        getLiveSize,
        getDockRect,
        getDockPreviewRect,
        detectDockSide,
        undockFromDrag,
        clampSizeToViewport,
        fitPanelToViewport,
        beginResize,
        clearDockedSide,
        applyDockPreview,
        restoreUndockedPanel,
        handleWindowResize,
        cleanupWindowResize,
    };
}

export const DockPreviewOverlay: Component<{
    rect: DockRect | null;
    zIndex: number;
}> = (props) => (
    <Show when={props.rect}>
        {(previewRect) => (
            <Portal>
                <div
                    style={{
                        position: 'fixed',
                        left: `${previewRect().x}px`,
                        top: `${previewRect().y}px`,
                        width: `${previewRect().width}px`,
                        height: `${previewRect().height}px`,
                        'z-index': props.zIndex,
                        'pointer-events': 'none',
                        'box-sizing': 'border-box',
                        border: '2px dashed var(--zylem-color-primary)',
                        background: 'rgba(10, 20, 30, 0.2)',
                        'border-radius': '0',
                    }}
                />
            </Portal>
        )}
    </Show>
);
