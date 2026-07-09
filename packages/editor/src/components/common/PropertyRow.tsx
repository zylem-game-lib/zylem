import { PropertyRow as UIPropertyRow } from '@zylem/ui/components';
import type { Component, JSX } from 'solid-js';
import { printToConsole } from '..';

export interface PropertyRowProps {
	label: string;
	/** The value to display. Can be a string, number, or JSX element. */
	value?: string | number | JSX.Element;
	/** If true, treat string values as paths and truncate long ones. */
	isPath?: boolean;
	/** Maximum path segments to show (default: 3 = filename + 2 parent dirs). */
	maxPathSegments?: number;
	/** Custom class for the value span. */
	valueClass?: string;
	/** Children can be used instead of value for complex content. */
	children?: JSX.Element;
}

/**
 * Editor PropertyRow — thin wrapper over the @zylem/ui HyperGlass
 * PropertyRow; clicking a truncated path logs the full path to the console.
 */
export const PropertyRow: Component<PropertyRowProps> = (props) => {
	return (
		<UIPropertyRow
			label={props.label}
			value={props.value}
			isPath={props.isPath}
			maxPathSegments={props.maxPathSegments}
			valueClass={props.valueClass}
			onPathClick={(fullValue) => printToConsole(`Full path: ${fullValue}`)}
		>
			{props.children}
		</UIPropertyRow>
	);
};
