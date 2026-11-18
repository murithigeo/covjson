import { defineConfig } from 'tsdown';
import tailwind from '@tailwindcss/postcss';
import url from 'postcss-url';
export default defineConfig({
	dts: true,
	suppressWarnings: (message) => {
		const warning = [
			'https://svelte.dev/e/custom_element_props_identifier',
			'https://svelte.dev/e/state_referenced_locally'
		].find((warning) => message.endsWith(warning));

		if (!warning) return false;
		console.log(`Suppressed error: ${warning}`);
		return true;
	},

	css: {
		transformer: 'postcss',
		postcss: {
			plugins: [tailwind(), url({ url: 'inline', fallback: () => 'copy' })]
		},
		minify: true
	}
});
