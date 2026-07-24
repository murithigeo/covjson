import { defineConfig } from '@svebcomponents/build';

export default defineConfig({
	entry: 'src/lib/web-components/**/*.svelte',
	outDir: 'dist/client',
	svelteOutDir: 'dist/client-svelte'
});
