import { Component, Show, createEffect, createMemo, createSignal } from 'solid-js';
import styles from './DemoPreviewImage.module.css';

interface DemoPreviewImageProps {
	exampleId: string;
	name: string;
	isActive?: boolean;
}

const PREVIEW_CDN_BASE_URL =
	import.meta.env.VITE_EXAMPLES_PREVIEW_CDN_BASE_URL?.replace(/\/+$/, '') ?? '';
const PREVIEW_IMAGE_EXTENSION =
	import.meta.env.VITE_EXAMPLES_PREVIEW_IMAGE_EXTENSION ?? 'png';
const localPreviewModules = import.meta.glob('../../../screenshots/*.png', {
	eager: true,
	query: '?url',
	import: 'default',
});
const localPreviewUrls = new Map(
	Object.entries(localPreviewModules).map(([filePath, fileUrl]) => [
		filePath.replace(/^.*\/([^/]+)\.png$/, '$1'),
		fileUrl as string,
	])
);

const DemoPreviewImage: Component<DemoPreviewImageProps> = (props) => {
	const [isLoaded, setIsLoaded] = createSignal(false);
	const [sourceMode, setSourceMode] = createSignal<'cdn' | 'local' | 'none'>(
		'none'
	);
	const localSrc = createMemo(() => localPreviewUrls.get(props.exampleId) ?? '');

	const cdnSrc = createMemo(() => {
		if (!PREVIEW_CDN_BASE_URL) {
			return '';
		}

		return `${PREVIEW_CDN_BASE_URL}/${props.exampleId}.${PREVIEW_IMAGE_EXTENSION}`;
	});
	const src = createMemo(() => {
		if (sourceMode() === 'cdn') {
			return cdnSrc();
		}

		if (sourceMode() === 'local') {
			return localSrc();
		}

		return '';
	});

	createEffect(() => {
		props.exampleId;
		setIsLoaded(false);

		if (cdnSrc()) {
			setSourceMode('cdn');
			return;
		}

		if (localSrc()) {
			setSourceMode('local');
			return;
		}

		setSourceMode('none');
	});

	return (
		<div
			class={`${styles.previewFrame} ${props.isActive ? styles.previewFrameActive : ''}`}
		>
			<Show
				when={src()}
				fallback={<div class={styles.previewFallback} />}
			>
				<img
					class={`${styles.previewImage} ${isLoaded() ? styles.previewImageLoaded : ''}`}
					src={src()}
					alt=""
					loading="lazy"
					decoding="async"
					onLoad={() => setIsLoaded(true)}
					onError={() => {
						setIsLoaded(false);

						if (sourceMode() === 'cdn' && localSrc()) {
							setSourceMode('local');
							return;
						}

						setSourceMode('none');
					}}
				/>
			</Show>
			<div class={styles.previewCaption}>
				<div class={styles.previewTitle}>{props.name}</div>
			</div>
		</div>
	);
};

export default DemoPreviewImage;
