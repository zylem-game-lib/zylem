// @vitest-environment happy-dom
/**
 * What the gizmo tools fall back to when nothing is selected.
 *
 * Two things feed it, and both matter: selecting an entity, and creating one.
 * Placement leaves the new entity unselected, so without the create path,
 * pressing Rotate straight after placing a box would have nothing to turn.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getZylemBridge, type SceneOperationPayload } from '@zylem/bridge';

import { connectEditorBridge } from '../../src/bridge/editor-bridge';
import {
	debugState,
	getLastTouchedEntityId,
	noteTouchedEntity,
	setSelectedEntityId,
} from '../../src/components/entities/entities-state';

let release: (() => void) | null = null;

beforeEach(() => {
	getZylemBridge().channel.reset();
	setSelectedEntityId(null);
	debugState.lastTouchedEntityId = null;
});

afterEach(() => {
	release?.();
	release = null;
});

function operation(
	kind: SceneOperationPayload['kind'],
	uuids: string[],
): SceneOperationPayload {
	return {
		opId: `op-${kind}`,
		kind,
		label: kind,
		entries: uuids.map((uuid) => ({ uuid })),
	} as SceneOperationPayload;
}

describe('recording from selection', () => {
	it('remembers a selected entity', () => {
		setSelectedEntityId('entity-1');

		expect(getLastTouchedEntityId()).toBe('entity-1');
	});

	it('keeps the memory when the selection is cleared', () => {
		// The whole point of storing it separately: deselecting must not erase
		// what you were last working on.
		setSelectedEntityId('entity-1');
		setSelectedEntityId(null);

		expect(debugState.selectedEntityId).toBeNull();
		expect(getLastTouchedEntityId()).toBe('entity-1');
	});

	it('moves to the newest selection', () => {
		setSelectedEntityId('entity-1');
		setSelectedEntityId('entity-2');

		expect(getLastTouchedEntityId()).toBe('entity-2');
	});

	it('ignores an explicit null', () => {
		setSelectedEntityId('entity-1');
		noteTouchedEntity(null);

		expect(getLastTouchedEntityId()).toBe('entity-1');
	});
});

describe('recording from scene operations', () => {
	it('remembers an entity the game just created', () => {
		release = connectEditorBridge();

		getZylemBridge().channel.send('scene:operation', operation('create', ['box-1']));

		expect(getLastTouchedEntityId()).toBe('box-1');
	});

	it('takes the last of a multi-entity create', () => {
		release = connectEditorBridge();

		getZylemBridge().channel.send(
			'scene:operation',
			operation('create', ['box-1', 'box-2']),
		);

		expect(getLastTouchedEntityId()).toBe('box-2');
	});

	it('leaves the memory alone for a transform', () => {
		// Moving an entity says nothing about which one you are working on next;
		// only selecting or creating does.
		release = connectEditorBridge();
		setSelectedEntityId('entity-1');

		getZylemBridge().channel.send('scene:operation', operation('transform', ['other-1']));

		expect(getLastTouchedEntityId()).toBe('entity-1');
	});

	it('leaves the memory alone for a delete', () => {
		release = connectEditorBridge();
		setSelectedEntityId('entity-1');

		getZylemBridge().channel.send('scene:operation', operation('delete', ['other-1']));

		expect(getLastTouchedEntityId()).toBe('entity-1');
	});
});

describe('the memory outliving its entity', () => {
	it('still names a deleted entity, leaving the check to the caller', () => {
		// Deliberate: the state is a plain record of what happened, and
		// `resolveTransformTarget` is what decides whether it is still usable.
		// Pruning here would need this module to track the entity list too.
		release = connectEditorBridge();
		getZylemBridge().channel.send('scene:operation', operation('create', ['box-1']));
		getZylemBridge().channel.send('entity:removed', { uuids: ['box-1'] });

		expect(getLastTouchedEntityId()).toBe('box-1');
	});
});
