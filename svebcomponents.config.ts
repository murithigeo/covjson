import { defineConfig, type DefineConfigOptions } from '@svebcomponents/build';
const conf: DefineConfigOptions = {
	ssrOutDir: './dist/plugin-ui/server',
	outDir: './dist/plugin-ui/client'
};
export default [
	...defineConfig({ entry: './src/lib/ui/Coverage.svelte', ...conf }),
	...defineConfig({ entry: './src/lib/ui/Parameter.svelte', ...conf }),
	...defineConfig({ entry: './src/lib/ui/ParameterGroup.svelte', ...conf }),
	...defineConfig({
		entry: './src/lib/core/index.ts',
		outDir: 'dist/core',
		ssr: false
	}),
	...defineConfig({
		entry: './src/lib/plugin-maplibre/index.ts',
		outDir: 'dist/plugin-maplibre',
		ssr: false
	})
];
