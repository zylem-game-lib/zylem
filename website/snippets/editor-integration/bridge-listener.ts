import { BRIDGE_READY_EVENT, getZylemBridge } from '@zylem/game-lib/bridge';

export function wireEditorBridge(gameElement: HTMLElement) {
	gameElement.addEventListener(BRIDGE_READY_EVENT, () => {
		const { channel } = getZylemBridge();
		channel.on('stage:snapshot', (snapshot) => {
			console.log('entities', snapshot.entities.length);
		});
		channel.send('debug:set', { enabled: true });
	});
}
