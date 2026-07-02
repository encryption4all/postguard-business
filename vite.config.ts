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
			exclude: [
				'src/lib/**/*.{test,spec}.{js,ts}',
				'src/lib/**/*.d.ts',
				// One-off DB migration scripts aren't unit-tested; excluding them keeps
				// the gate focused on testable lib code (and stops a future untested
				// migration from tripping it on an unrelated PR).
				'src/lib/server/migrations/**'
			],
			// Baseline (2026-07, migrations excluded) is ~20% stmts / 30% branch /
			// 9% funcs / 19% lines. Thresholds sit a couple points below to lock in a
			// no-regression floor without tripping on the current state; ratchet up
			// as lib coverage improves.
			thresholds: {
				statements: 18,
				branches: 27,
				functions: 7,
				lines: 17
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
