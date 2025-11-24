import { proxy } from 'valtio/vanilla';
import { get, set } from 'idb-keyval';
import { pack, unpack } from 'msgpackr';
import { StageBlueprint } from '../core/blueprints';

// The State
export const stageState = proxy({
  previous: null as StageBlueprint | null,
  current: null as StageBlueprint | null,
  next: null as StageBlueprint | null,
  isLoading: false,
});

// The Logic
export const StageManager = {
  staticRegistry: new Map<string, StageBlueprint>(),

  registerStaticStage(id: string, blueprint: StageBlueprint) {
    this.staticRegistry.set(id, blueprint);
  },

  async loadStageData(stageId: string): Promise<StageBlueprint> {
    // 1. Check Local Storage (User Save)
    try {
      const saved = await get(stageId);
      if (saved) {
        // msgpackr returns a buffer, we need to unpack it
        return unpack(saved);
      }
    } catch (e) {
      console.warn(`Failed to load stage ${stageId} from storage`, e);
    }

    // 2. Fallback to Static File (Initial Load)
    if (this.staticRegistry.has(stageId)) {
      return this.staticRegistry.get(stageId)!;
    }

    // Note: This assumes a convention where stages are importable.
    // You might need a registry or a specific path structure.
    // For now, we'll assume a dynamic import from a known location or a registry.
    // Since dynamic imports with variables can be tricky in bundlers, 
    // we might need a map of stage IDs to import functions if the path isn't static enough.
    
    // TODO: Implement a robust way to resolve stage paths.
    // For now, throwing an error if not found in storage, as the static loading strategy 
    // depends on project structure.
    throw new Error(`Stage ${stageId} not found in storage and static loading not fully implemented.`);
  },

  async transitionForward(nextStageId: string, loadStaticStage?: (id: string) => Promise<StageBlueprint>) {
    if (stageState.isLoading) return;
    
    stageState.isLoading = true;

    try {
      // Save current state to disk before unloading
      if (stageState.current) {
        await set(stageState.current.id, pack(stageState.current));
      }

      // Shift Window
      stageState.previous = stageState.current;
      stageState.current = stageState.next;
      
      // If we don't have a next stage preloaded (or if we just shifted it to current),
      // we might need to load the *new* next stage. 
      // But the architecture doc says "Fetch new Next".
      // Let's assume we want to load the requested nextStageId as the *new Current* 
      // if it wasn't already in 'next'. 
      // Actually, the sliding window usually implies we move towards 'next'.
      // If 'next' was already populated with nextStageId, we just move it to 'current'.
      
      if (stageState.current?.id !== nextStageId) {
         // If the shift didn't result in the desired stage (e.g. we jumped), load it directly.
         // Or if 'next' was null.
         if (loadStaticStage) {
             stageState.current = await loadStaticStage(nextStageId);
         } else {
             stageState.current = await this.loadStageData(nextStageId);
         }
      }

      // Ideally we would pre-fetch the stage *after* this one into 'next'.
      // But we don't know what comes after 'nextStageId' without a map.
      // For now, we leave 'next' null or let the game logic trigger a preload.
      stageState.next = null; 
      
    } catch (error) {
      console.error("Failed to transition stage:", error);
    } finally {
      stageState.isLoading = false;
    }
  },
  
  /**
   * Manually set the next stage to pre-load it.
   */
  async preloadNext(stageId: string, loadStaticStage?: (id: string) => Promise<StageBlueprint>) {
      if (loadStaticStage) {
          stageState.next = await loadStaticStage(stageId);
      } else {
          stageState.next = await this.loadStageData(stageId);
      }
  }
};
