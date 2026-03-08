import { Component, For } from 'solid-js';

import {
  VIEWPORT_PRESETS,
  applyViewportPreset,
  demoViewportStore,
  setViewportProfile,
} from '../../store/demoViewportStore';
import styles from './ViewportControls.module.css';

const PROFILE_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18 8a6.5 6.5 0 0 0-10.96-1.68"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6 6.32V9.5h3.18"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M6 16a6.5 6.5 0 0 0 10.96 1.68"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M18 17.68V14.5h-3.18"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    ),
  },
  {
    value: 'desktop',
    label: 'Desktop',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3.5"
          y="5"
          width="17"
          height="11"
          rx="2"
          stroke="currentColor"
          stroke-width="1.8"
        />
        <path
          d="M9 19h6"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <path
          d="M12 16v3"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </svg>
    ),
  },
  {
    value: 'mobile',
    label: 'Mobile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="7.25"
          y="3.5"
          width="9.5"
          height="17"
          rx="2.5"
          stroke="currentColor"
          stroke-width="1.8"
        />
        <path
          d="M10.5 6.5h3"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
        />
        <circle cx="12" cy="17.25" r="0.8" fill="currentColor" />
      </svg>
    ),
  },
] as const;

const ViewportPresetIcon: Component<{ width: number; height: number }> = (
  props,
) => {
  const maxDimension = Math.max(props.width, props.height);
  const frameWidth = Math.round(6 + (props.width / maxDimension) * 12);
  const frameHeight = Math.round(6 + (props.height / maxDimension) * 12);
  const x = Math.round((24 - frameWidth) / 2);
  const y = Math.round((24 - frameHeight) / 2);

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x={x}
        y={y}
        width={frameWidth}
        height={frameHeight}
        rx="2"
        stroke="currentColor"
        stroke-width="1.8"
      />
      <circle cx={x + 2.25} cy={y + 2.25} r="0.8" fill="currentColor" />
    </svg>
  );
};

const ViewportControls: Component = () => {
  const isCompact = () => demoViewportStore.viewportControlsMode === 'compact';

  return (
    <div
      class={`${styles.toolbar} ${isCompact() ? styles.toolbarCompact : ''}`}
    >
      <div class={styles.toolbarGroup}>
        <For each={PROFILE_OPTIONS}>
          {(option) => (
            <button
              type="button"
              class={`${styles.toolbarButton} ${demoViewportStore.viewportProfile === option.value ? styles.toolbarButtonActive : ''}`}
              onClick={() => setViewportProfile(option.value)}
              title={option.label}
              aria-label={`Viewport profile: ${option.label}`}
            >
              <span class={styles.buttonIcon}>{option.icon}</span>
              <span class={styles.buttonText}>{option.label}</span>
            </button>
          )}
        </For>
      </div>
      <div class={styles.toolbarGroup}>
        <For each={VIEWPORT_PRESETS}>
          {(preset) => (
            <button
              type="button"
              class={`${styles.toolbarButton} ${demoViewportStore.activePresetLabel === preset.label ? styles.toolbarButtonActive : ''}`}
              onClick={() => applyViewportPreset(preset)}
              title={preset.label}
              aria-label={`Viewport preset: ${preset.label}`}
            >
              <span class={styles.buttonIcon}>
                <ViewportPresetIcon
                  width={preset.width}
                  height={preset.height}
                />
              </span>
              <span class={styles.buttonText}>{preset.label}</span>
            </button>
          )}
        </For>
      </div>
      <div class={styles.viewportMeta}>
        <span>
          {demoViewportStore.measuredViewportSize.width} x{' '}
          {demoViewportStore.measuredViewportSize.height}
        </span>
        <span>{demoViewportStore.viewportProfile}</span>
      </div>
    </div>
  );
};

export default ViewportControls;
