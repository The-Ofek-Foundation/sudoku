import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/setupTests.ts'],
		alias: {
			$lib: '/src/lib',
			'$app/navigation': '/src/mocks/app-navigation.ts',
		},
	},
	resolve: {
		conditions: ['browser', 'svelte'],
	},
});
