import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { execSync } from 'child_process';

const commitHash = (() => {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return '';
	}
})();

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__COMMIT_HASH__: JSON.stringify(commitHash)
	},
	resolve: {
		alias: {
			// yivi-css has "main": "dist/yivi.min.css" which Vite 8 can't resolve as a JS import
			'@privacybydesign/yivi-css': '@privacybydesign/yivi-css/dist/yivi.css'
		}
	},
	optimizeDeps: {
		// These are dynamically imported in YiviLogin.svelte so Vite won't discover
		// them at startup. Force pre-bundling to avoid runtime failures.
		include: [
			'@privacybydesign/yivi-core',
			'@privacybydesign/yivi-web',
			'@privacybydesign/yivi-client',
			'deepmerge'
		]
	},
	server: {
		// HMR through nginx proxy on port 8080
		hmr: {
			clientPort: 8080
		},
		// File watching with polling for Docker on macOS
		watch: {
			usePolling: true,
			interval: 1000
		}
	},
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text-summary', 'text', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/lib/**/*.{ts,js}'],
			exclude: ['src/lib/**/*.{test,spec}.{js,ts}', 'src/lib/**/*.d.ts'],
			// Baseline (2026-07) is ~33% stmts / 47% branch / 16% funcs. Thresholds
			// sit just below to prevent regression; ratchet them up over time.
			thresholds: {
				statements: 30,
				branches: 40,
				functions: 15,
				lines: 30
			}
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}', 'tests/unit/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
