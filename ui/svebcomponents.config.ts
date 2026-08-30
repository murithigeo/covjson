import { defineConfig } from '@svebcomponents/build';

export default defineConfig({
	entry: 'src/lib/dashboards/templates/*.svelte',
	outDir: 'dist/client',
	svelteOutDir: 'dist/client-svelte',
	svelteConfig: './svelte.config.js'
});
