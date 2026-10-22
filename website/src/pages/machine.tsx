import { useEffect, useRef, useState, type ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';

/** The standalone Anatomy document keeps its drawing styles out of the docs theme. */
export default function MachinePage(): ReactNode {
	const iframe = useRef<HTMLIFrameElement>(null);
	const [height, setHeight] = useState(1100);
	const source = useBaseUrl('/anatomy/frame-machine/');
	useEffect(() => {
		const frame = iframe.current!;
		let observer: ResizeObserver | undefined;
		const resize = () => {
			observer?.disconnect();
			const page = frame.contentDocument?.querySelector<HTMLElement>('.page');
			if (!page) return;
			const measure = () => {
				const style = page.ownerDocument.defaultView!.getComputedStyle(page.ownerDocument.body);
				setHeight(Math.ceil(page.getBoundingClientRect().height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)));
			};
			observer = new ResizeObserver(measure);
			observer.observe(page);
			measure();
		};
		frame.addEventListener('load', resize);
		// The static iframe can finish loading before React hydrates this page.
		resize();
		return () => { frame.removeEventListener('load', resize); observer?.disconnect(); };
	}, [source]);
	return (
		<Layout title="The frame press" description="An interactive Anatomy machine explaining Zylem’s game update and independent render loop.">
			<main>
				<iframe ref={iframe} src={source} title="Interactive Zylem frame press" style={{ display: 'block', width: '100%', height, border: 0 }} />
			</main>
		</Layout>
	);
}
