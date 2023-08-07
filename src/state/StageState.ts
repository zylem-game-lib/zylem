import { StageOptions } from '@interfaces/Game';
import { Color } from 'three';
import { proxy, useSnapshot, subscribe } from 'valtio';

const state = proxy({
	backgroundColor: Color.NAMES.cornflowerblue,
	children: () => { }
} as StageOptions);

export { state, useSnapshot, subscribe }