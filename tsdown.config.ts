import { defineConfig } from 'tsdown';
import tailwind from '@tailwindcss/postcss';
export default defineConfig({
	suppressWarnings: (message) => {
		const ignoreWarnings = [
			'https://svelte.dev/e/custom_element_props_identifier',
			'https://svelte.dev/e/state_referenced_locally'
		];
		if (ignoreWarnings.some((warning) => message.endsWith(warning))) return true;
		return false;
	},
	css: {
		transformer: 'postcss',
		postcss: {
			plugins: [
				tailwind()
				//	url({ url: 'inline', fallback: () => 'copy' })
			]
		},
		minify: true
	}
});
