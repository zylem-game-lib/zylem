import { describe, expect, test } from 'vitest';
import { render } from '@solidjs/testing-library';
import { Debug } from '../../lib/ui/Debug';

describe('<Debug />', () => {
  test('renders with debug button', () => {
    const { container } = render(() => <Debug />);

    const debugButton = container.querySelector('#zylem-debug-button');
    expect(debugButton).toBeTruthy();
    expect(debugButton?.tagName).toBe('BUTTON');
  });
});
