/**
 * `@zylem/game-lib/bridge` public API.
 *
 * Game-side surface of the shared editor ↔ game bridge. External hosts can
 * use `getZylemBridge()` to subscribe to game→editor messages or send
 * editor→game commands without importing editor internals.
 * @public
 */
export { GameBridge, type GameBridgeHost } from '../lib/bridge/game-bridge';

export {
	getZylemBridge,
	announceBridgeReady,
	BRIDGE_READY_EVENT,
	type ZylemBridge,
	type BridgeChannel,
	type BridgeHandler,
	type BridgeMessages,
	type BridgeMessageType,
	type GameToEditorMessages,
	type EditorToGameMessages,
	type GameConfigPayload,
	type GameLoadingPayload as BridgeLoadingPayload,
	type GameVariablePayload,
	type StageConfigPayload,
	type StageSnapshotPayload,
	type EntitySummaryPayload,
	type EntityThumbnailPayload,
	type BridgeDebugTool,
	type BridgeVec3,
} from '@zylem/bridge';
