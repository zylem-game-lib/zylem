import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const require = createRequire(import.meta.url);

const configDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(configDir, '..');

async function run(): Promise<void> {
	const typescriptCompilerFolder = path.dirname(require.resolve('typescript/package.json'));

	const apiExtractorJsonPath = path.resolve(projectRoot, './config/api-extractor.json');
	try {
		const extractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
		const result = Extractor.invoke(extractorConfig, {
			localBuild: true,
			showVerboseMessages: true,
			typescriptCompilerFolder,
		});
		if (result.succeeded) {
			console.log('API Extractor completed successfully');
		} else {
			console.warn(
				`API Extractor completed with ${result.errorCount} errors and ${result.warningCount} warnings`,
			);
		}
	} catch (err: unknown) {
		const error = err as Error;
		const msg = error && error.message ? error.message : String(err);
		console.warn(`API Extractor was skipped due to configuration error: ${msg}`);
		if (error && (error as any).stack) {
			console.error((error as any).stack);
		}
	}
}

run();


