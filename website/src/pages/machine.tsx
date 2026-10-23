import { useEffect, useRef, useState, type ReactNode } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import styles from './machine.module.css';

const machines = [
	{ id: 'game', label: 'Game' },
	{ id: 'config', label: 'Config' },
	{ id: 'stage', label: 'Stage' },
	{ id: 'entity', label: 'Entity' },
	{ id: 'frame', label: 'Frame press' },
];

/** The standalone Anatomy document keeps its drawing styles out of the docs theme. */
export default function MachinePage(): ReactNode {
	const iframe = useRef<HTMLIFrameElement>(null);
	const [height, setHeight] = useState(1100);
	const [selected, setSelected] = useState('game');
	const source = useBaseUrl(`/anatomy/${selected}-machine/`);
	useEffect(() => {
		const readHash = () => {
			const id = window.location.hash.slice(1);
			setSelected(machines.some(machine => machine.id === id) ? id : 'game');
		};
		readHash();
		window.addEventListener('hashchange', readHash);
		return () => window.removeEventListener('hashchange', readHash);
	}, []);
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
		<Layout title="The Zylem machines" description="Interactive Anatomy machines for Game, Config, Stage, Entity, and the game update loop.">
			<main>
				<nav className={styles.galleryNav} aria-label="Choose a Zylem machine">
					{machines.map(machine => (
						<a key={machine.id} href={`#${machine.id}`} aria-current={selected === machine.id ? 'page' : undefined}>{machine.label}</a>
					))}
				</nav>
				<iframe key={selected} ref={iframe} src={source} title={`Interactive Zylem ${machines.find(machine => machine.id === selected)!.label} machine`} style={{ display: 'block', width: '100%', height, border: 0 }} />
			</main>
		</Layout>
	);
}
