import { InputGamepad } from './input';

export interface InputProvider {
	getInput(delta: number): Partial<InputGamepad>;
	isConnected(): boolean;
	getName(): string;
} 