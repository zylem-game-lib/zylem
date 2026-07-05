import { Router } from '@solidjs/router';
import { render } from 'solid-js/web';
import App from './App';
import { appRoutes } from './app-routes';
import './styles.css';

const root = document.getElementById('root');

if (root) {
	render(() => <Router root={App}>{appRoutes}</Router>, root);
}
