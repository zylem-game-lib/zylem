import type { RouteSectionProps } from '@solidjs/router';
import { ZylemGameElement } from '@zylem/game-lib/web-components';
import type { Component } from 'solid-js';

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

const App: Component<RouteSectionProps> = props => {
	return <>{props.children}</>;
};

export default App;
