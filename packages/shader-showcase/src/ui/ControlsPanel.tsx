import { type Component, For, Match, Show, Switch, createSignal } from 'solid-js';
import type {
	ColorControl,
	GlslControl,
	RangeControl,
	ShowcaseControl,
	ShowcaseDemo,
} from '../demo-types';

const RangeRow: Component<{ control: RangeControl }> = props => {
	const [value, setValue] = createSignal(props.control.value);
	return (
		<label class="control-row">
			<span class="control-label">
				{props.control.label}
				<span class="control-value">{formatNumber(value())}</span>
			</span>
			<input
				type="range"
				min={props.control.min}
				max={props.control.max}
				step={props.control.step}
				value={value()}
				onInput={event => {
					const next = Number(event.currentTarget.value);
					setValue(next);
					props.control.onChange(next);
				}}
			/>
		</label>
	);
};

const ColorRow: Component<{ control: ColorControl }> = props => {
	const [value, setValue] = createSignal(props.control.value);
	return (
		<label class="control-row control-row-color">
			<span class="control-label">{props.control.label}</span>
			<input
				type="color"
				value={value()}
				onInput={event => {
					const next = event.currentTarget.value;
					setValue(next);
					props.control.onChange(next);
				}}
			/>
		</label>
	);
};

const GlslRow: Component<{ control: GlslControl }> = props => {
	const [code, setCode] = createSignal(props.control.initial);
	const [error, setError] = createSignal<string | null>(null);
	const [applied, setApplied] = createSignal(false);
	return (
		<div class="control-row control-row-glsl">
			<span class="control-label">{props.control.label}</span>
			<textarea
				spellcheck={false}
				value={code()}
				onInput={event => {
					setCode(event.currentTarget.value);
					setApplied(false);
				}}
			/>
			<button
				type="button"
				onClick={() => {
					const result = props.control.apply(code());
					setError(result);
					setApplied(result === null);
				}}
			>
				Apply shader
			</button>
			<Show when={error()}>
				<div class="control-error">{error()}</div>
			</Show>
			<Show when={applied()}>
				<div class="control-success">Shader applied</div>
			</Show>
		</div>
	);
};

const ControlRow: Component<{ control: ShowcaseControl }> = props => {
	return (
		<Switch>
			<Match when={props.control.type === 'range'}>
				<RangeRow control={props.control as RangeControl} />
			</Match>
			<Match when={props.control.type === 'color'}>
				<ColorRow control={props.control as ColorControl} />
			</Match>
			<Match when={props.control.type === 'glsl'}>
				<GlslRow control={props.control as GlslControl} />
			</Match>
		</Switch>
	);
};

const ControlsPanel: Component<{ demo: ShowcaseDemo; title: string }> = props => {
	return (
		<aside class="controls-panel">
			<h2>{props.title}</h2>
			<Show when={props.demo.description}>
				<p class="controls-description">{props.demo.description}</p>
			</Show>
			<For each={props.demo.controls}>{control => <ControlRow control={control} />}</For>
		</aside>
	);
};

function formatNumber(value: number): string {
	return Math.abs(value) < 0.01 && value !== 0 ? value.toExponential(2) : String(Math.round(value * 1000) / 1000);
}

export default ControlsPanel;
