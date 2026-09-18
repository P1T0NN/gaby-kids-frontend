import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			strategy: ['url', 'baseLocale'],
			routeStrategies: [
				{ match: '/admin/:path(.*)?', strategy: ['cookie', 'baseLocale'] },
				{ match: '/api/:path(.*)?', exclude: true }
			],
			urlPatterns: [
				{
					pattern: ':protocol://:domain(.*)::port?/:path(.*)?',
					localized: [['en', ':protocol://:domain(.*)::port?/en/:path(.*)?']]
				}
			]
		}),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true,

				experimental: {
					async: true
				}
			},

			alias: {
				'@': './src',
				'@convex': './src/convex'
			},

			experimental: {
				remoteFunctions: true
			},

			// adapter-vercel targets Vercel's build output and runtime, see https://svelte.dev/docs/kit/adapter-vercel.
			adapter: adapter()
		})
	],

	// preview serves on the same port as dev — keep the muscle memory.
	preview: {
		port: 5173,
		strictPort: true
	}
});
