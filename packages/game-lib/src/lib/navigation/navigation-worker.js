// Kept as a real .js file so both Vite's URL transform and the published bundle resolve it.
import { bakeNavigationData } from './bake.ts';

self.onmessage = async ({ data }) => {
	try {
		const bytes = await bakeNavigationData(data);
		self.postMessage({ bytes }, [bytes.buffer]);
	} catch (error) {
		self.postMessage({ error: error instanceof Error ? error.message : String(error) });
	}
};
