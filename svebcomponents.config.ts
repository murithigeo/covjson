import { defineConfig, type DefineConfigOptions } from '@svebcomponents/build';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
const conf: DefineConfigOptions = {
	outDir: 'dist/plugin-ui/client',
	ssrOutDir: 'dist/plugin-ui/ssr',
	svelteConfig: {
		preprocess: vitePreprocess(),
		extensions: ['.svelte'],
		compilerOptions: { css: 'injected' }
	}
};
export default [
	...defineConfig({
		entry: './src/lib/plugin-ui/Coverage.svelte',
		ssrEntryFileName: 'Coverage-ssr',
		...conf
	}),
	...defineConfig({
		entry: './src/lib/plugin-ui/Parameter.svelte',
		ssrEntryFileName: 'Parameter-ssr',
		...conf
	}),
	...defineConfig({
		entry: './src/lib/plugin-ui/ParameterGroup.svelte',
		ssrEntryFileName: 'ParameterGroup-ssr',
		...conf
	}),
	...defineConfig({
		entry: './src/lib/core/index.ts',
		outDir: 'dist/core',
		ssr: false
	}),
	...defineConfig({
		entry: './src/lib/plugin-maplibre/index.ts',
		outDir: 'dist/plugin-maplibre',
		neverBundle: ['maplibre-gl'],
		ssr: false
	})
];
