import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
	title: 'Zylem',
	tagline: 'A TypeScript framework for simple 3D web games',
	favicon: 'img/favicon.ico',
	url: 'https://zylem-game-lib.github.io',
	baseUrl: '/zylem/',
	organizationName: 'zylem-game-lib',
	projectName: 'zylem',
	onBrokenLinks: 'throw',
	markdown: {
		format: 'md',
		mermaid: true,
		hooks: {
			onBrokenMarkdownLinks: 'throw',
		},
	},
	themes: ['@docusaurus/theme-mermaid'],
	i18n: {
		defaultLocale: 'en',
		locales: ['en'],
	},
	presets: [
		[
			'classic',
			{
				docs: {
					sidebarPath: './sidebars.ts',
					editUrl: 'https://github.com/zylem-game-lib/zylem/tree/main/website/',
				},
				blog: false,
				theme: {
					customCss: './src/css/custom.css',
				},
			} satisfies Preset.Options,
		],
	],
	plugins: [
		[
			'@easyops-cn/docusaurus-search-local',
			{
				hashed: true,
				docsRouteBasePath: '/docs',
				indexBlog: false,
			},
		],
		function rawLoaderPlugin() {
			return {
				name: 'raw-loader-plugin',
				configureWebpack() {
					return {
						module: {
							rules: [
								{
									test: /\.ts$/,
									resourceQuery: /raw/,
									type: 'asset/source',
								},
							],
						},
					};
				},
			};
		},
	],
	themeConfig: {
		image: 'img/social-card.png',
		navbar: {
			title: 'Zylem',
			items: [
				{ type: 'docSidebar', sidebarId: 'guide', position: 'left', label: 'Guide' },
				{ type: 'docSidebar', sidebarId: 'api', position: 'left', label: 'API' },
				{ type: 'docSidebar', sidebarId: 'architecture', position: 'left', label: 'Architecture' },
				{
					href: 'https://zylem.onrender.com',
					label: 'Demos',
					position: 'right',
				},
				{
					href: 'https://www.npmjs.com/package/@zylem/game-lib',
					label: 'npm',
					position: 'right',
				},
				{
					href: 'https://github.com/zylem-game-lib/zylem',
					label: 'GitHub',
					position: 'right',
				},
			],
		},
		footer: {
			style: 'dark',
			links: [
				{
					title: 'Docs',
					items: [
						{ label: 'Get started', to: '/docs/getting-started/installation' },
						{ label: 'API reference', to: '/docs/api' },
						{ label: 'Architecture', to: '/docs/architecture/overview' },
					],
				},
				{
					title: 'More',
					items: [
						{ label: 'Demos', href: 'https://zylem.onrender.com' },
						{ label: 'GitHub', href: 'https://github.com/zylem-game-lib/zylem' },
					],
				},
			],
			copyright: `Copyright © ${new Date().getFullYear()} Tim Cool. MIT licensed.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ['bash', 'json'],
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
