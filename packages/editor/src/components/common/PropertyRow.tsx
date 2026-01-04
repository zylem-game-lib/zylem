import type { Component, JSX } from 'solid-js';
import { Show, createMemo } from 'solid-js';
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
 * Truncate a path to show only the last N segments.
 * @example truncatePath('/a/b/c/d/file.png', 3) => '.../c/d/file.png'
 */
function truncatePath(path: string, maxSegments: number = 3): { truncated: string; isTruncated: boolean } {
	// Handle both forward and backslashes
	const separator = path.includes('\\') ? '\\' : '/';
	const segments = path.split(separator).filter(Boolean);
	
	if (segments.length <= maxSegments) {
		return { truncated: path, isTruncated: false };
	}
	
	const lastSegments = segments.slice(-maxSegments);
	return {
		truncated: `...${separator}${lastSegments.join(separator)}`,
		isTruncated: true,
	};
}

/**
 * Check if a string looks like a file path.
 */
function looksLikePath(value: string): boolean {
	// Check for common path patterns
	return (
		value.includes('/') ||
		value.includes('\\') ||
		/^[A-Za-z]:/.test(value) || // Windows drive letter
		value.startsWith('.') ||
		value.startsWith('~')
	);
}

/**
 * PropertyRow - A reusable component for displaying label/value pairs.
 * 
 * Features:
 * - Automatic path truncation for long file paths
 * - Click-to-log for truncated paths
 * - Supports both string values and custom JSX children
 */
export const PropertyRow: Component<PropertyRowProps> = (props) => {
	const displayValue = createMemo(() => {
		// If children are provided, use those
		if (props.children !== undefined) {
			return { element: props.children, isClickable: false, fullValue: null };
		}

		// If value is not a string, just display it
		if (typeof props.value !== 'string') {
			return { element: props.value, isClickable: false, fullValue: null };
		}

		const stringValue = props.value;
		const shouldTruncate = props.isPath ?? looksLikePath(stringValue);
		
		if (shouldTruncate) {
			const { truncated, isTruncated } = truncatePath(stringValue, props.maxPathSegments ?? 3);
			return {
				element: truncated,
				isClickable: isTruncated,
				fullValue: isTruncated ? stringValue : null,
			};
		}
		
		return { element: stringValue, isClickable: false, fullValue: null };
	});

	const handleClick = () => {
		const { fullValue } = displayValue();
		if (fullValue) {
			printToConsole(`Full path: ${fullValue}`);
		}
	};

	return (
		<div class="zylem-property-row">
			<span class="zylem-property-label">{props.label}</span>
			<Show
				when={displayValue().isClickable}
				fallback={
					<span class={`zylem-property-value ${props.valueClass ?? ''}`}>
						{displayValue().element}
					</span>
				}
			>
				<span
					class={`zylem-property-value zylem-property-value--clickable ${props.valueClass ?? ''}`}
					onClick={handleClick}
					title="Click to log full path"
				>
					{displayValue().element}
				</span>
			</Show>
		</div>
	);
};
