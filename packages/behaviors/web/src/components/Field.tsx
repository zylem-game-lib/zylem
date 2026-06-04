import { Match, Switch } from 'solid-js';
import type { FieldDef } from '../harnesses/types';

interface FieldProps {
	field: FieldDef;
	value: any;
	onChange: (next: any) => void;
}

function parseNumber(raw: string, fallback: number): number {
	const n = Number(raw);
	return Number.isFinite(n) ? n : fallback;
}

export default function Field(props: FieldProps) {
	return (
		<div class="field-row">
			<label class="field-label" title={props.field.help ?? ''}>
				{props.field.label}
			</label>
			<Switch fallback={<div class="field-input">unsupported</div>}>
				<Match when={props.field.kind.type === 'number'}>
					<input
						class="field-input"
						type="number"
						step={
							(props.field.kind as { step?: number }).step ?? 'any'
						}
						value={props.value ?? 0}
						onInput={(e) =>
							props.onChange(
								parseNumber(e.currentTarget.value, props.value ?? 0),
							)
						}
					/>
				</Match>

				<Match when={props.field.kind.type === 'string'}>
					<input
						class="field-input"
						type="text"
						value={props.value ?? ''}
						onInput={(e) => props.onChange(e.currentTarget.value)}
					/>
				</Match>

				<Match when={props.field.kind.type === 'boolean'}>
					<div class="checkbox-row">
						<input
							type="checkbox"
							checked={!!props.value}
							onChange={(e) => props.onChange(e.currentTarget.checked)}
						/>
						<span class="field-label">{props.value ? 'true' : 'false'}</span>
					</div>
				</Match>

				<Match when={props.field.kind.type === 'vec2'}>
					<div class="field-vec">
						<span class="field-axis">x</span>
						<input
							class="field-input"
							type="number"
							step="any"
							value={props.value?.x ?? 0}
							onInput={(e) =>
								props.onChange({
									...(props.value ?? { x: 0, y: 0 }),
									x: parseNumber(e.currentTarget.value, 0),
								})
							}
						/>
						<span class="field-axis">y</span>
						<input
							class="field-input"
							type="number"
							step="any"
							value={props.value?.y ?? 0}
							onInput={(e) =>
								props.onChange({
									...(props.value ?? { x: 0, y: 0 }),
									y: parseNumber(e.currentTarget.value, 0),
								})
							}
						/>
					</div>
				</Match>

				<Match when={props.field.kind.type === 'bounds-rect'}>
					<div class="field-vec">
						<span class="field-axis">w</span>
						<input
							class="field-input"
							type="number"
							step="any"
							value={props.value?.width ?? 0}
							onInput={(e) =>
								props.onChange({
									...props.value,
									width: parseNumber(e.currentTarget.value, 0),
								})
							}
						/>
						<span class="field-axis">h</span>
						<input
							class="field-input"
							type="number"
							step="any"
							value={props.value?.height ?? 0}
							onInput={(e) =>
								props.onChange({
									...props.value,
									height: parseNumber(e.currentTarget.value, 0),
								})
							}
						/>
					</div>
				</Match>

				<Match when={props.field.kind.type === 'bounds-ltrb'}>
					<div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '6px' }}>
						<div class="field-vec">
							<span class="field-axis">L</span>
							<input
								class="field-input"
								type="number"
								step="any"
								value={props.value?.left ?? 0}
								onInput={(e) =>
									props.onChange({
										...props.value,
										left: parseNumber(e.currentTarget.value, 0),
									})
								}
							/>
						</div>
						<div class="field-vec">
							<span class="field-axis">R</span>
							<input
								class="field-input"
								type="number"
								step="any"
								value={props.value?.right ?? 0}
								onInput={(e) =>
									props.onChange({
										...props.value,
										right: parseNumber(e.currentTarget.value, 0),
									})
								}
							/>
						</div>
						<div class="field-vec">
							<span class="field-axis">T</span>
							<input
								class="field-input"
								type="number"
								step="any"
								value={props.value?.top ?? 0}
								onInput={(e) =>
									props.onChange({
										...props.value,
										top: parseNumber(e.currentTarget.value, 0),
									})
								}
							/>
						</div>
						<div class="field-vec">
							<span class="field-axis">B</span>
							<input
								class="field-input"
								type="number"
								step="any"
								value={props.value?.bottom ?? 0}
								onInput={(e) =>
									props.onChange({
										...props.value,
										bottom: parseNumber(e.currentTarget.value, 0),
									})
								}
							/>
						</div>
					</div>
				</Match>

				<Match when={props.field.kind.type === 'json'}>
					<textarea
						class="field-input"
						style={{ 'font-family': 'var(--mono)', 'min-height': '64px' }}
						value={JSON.stringify(props.value, null, 2)}
						onChange={(e) => {
							try {
								props.onChange(JSON.parse(e.currentTarget.value));
							} catch {
								/* ignore parse errors */
							}
						}}
					/>
				</Match>
			</Switch>
		</div>
	);
}
