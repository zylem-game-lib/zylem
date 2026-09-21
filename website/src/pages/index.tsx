import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

const cards = [
	{
		title: 'Get started',
		to: '/docs/getting-started/installation',
		body: 'Install @zylem/game-lib and run a controllable sphere in a few minutes.',
	},
	{
		title: 'Guide',
		to: '/docs/intro',
		body: 'Task-oriented docs for games, stages, entities, behaviors, input, and more.',
	},
	{
		title: 'API reference',
		to: '/docs/api',
		body: 'Generated from the public @zylem/game-lib/* entry points.',
	},
	{
		title: 'Architecture',
		to: '/docs/architecture/overview',
		body: 'Mermaid maps of the runtime: frame loop, stages, camera, physics, and the editor bridge.',
	},
];

export default function Home(): ReactNode {
	const { siteConfig } = useDocusaurusContext();
	return (
		<Layout title={siteConfig.title} description={siteConfig.tagline}>
			<header className={clsx('hero hero--primary')}>
				<div className="container">
					<Heading as="h1" className="hero__title">
						{siteConfig.title}
					</Heading>
					<p className="hero__subtitle">{siteConfig.tagline}</p>
					<div>
						<Link className="button button--secondary button--lg" to="/docs/getting-started/your-first-game">
							Your first game
						</Link>
					</div>
				</div>
			</header>
			<main>
				<section className="container margin-vert--xl">
					<div className="row">
						{cards.map((card) => (
							<div key={card.title} className="col col--3 margin-bottom--lg">
								<div className="card">
									<div className="card__header">
										<Heading as="h3">{card.title}</Heading>
									</div>
									<div className="card__body">
										<p>{card.body}</p>
									</div>
									<div className="card__footer">
										<Link className="button button--primary button--block" to={card.to}>
											Open
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			</main>
		</Layout>
	);
}
