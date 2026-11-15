import type { RouteSectionProps } from '@solidjs/router';
import { ZylemGameElement } from '@zylem/game-lib/web-components';
import { BuildLabel } from '@zylem/ui/components';
import type { Component } from 'solid-js';
import { ZYLEM_PACKAGE_VERSIONS } from 'virtual:zylem-versions';

if (!customElements.get('zylem-game')) {
	customElements.define('zylem-game', ZylemGameElement);
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'zylem-game': any;
		}
	}
}

const App: Component<RouteSectionProps> = (props) => {
	return (
		<>
			<BuildLabel packages={ZYLEM_PACKAGE_VERSIONS} prefer="@zylem/game-lib" />
			{props.children}
		</>
	);
};

export default App;
