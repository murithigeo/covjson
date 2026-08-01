import { defineConfig } from '@svebcomponents/build';

export default defineConfig({
	entry: 'src/lib/web-components/dashboards/*.svelte',
	outDir: 'dist/client',
	svelteOutDir: 'dist/client-svelte'
});
