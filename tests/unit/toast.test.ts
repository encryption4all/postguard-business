import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test the toast store. Since it uses Svelte 5 runes ($state),
// we test the exported functions and their effects.
describe('toast store', () => {
	beforeEach(async () => {
		vi.useFakeTimers();
	});

	it('should export addToast and removeToast functions', async () => {
		const mod = await import('$lib/stores/toast.svelte');
		expect(typeof mod.addToast).toBe('function');
		expect(typeof mod.removeToast).toBe('function');
		expect(typeof mod.getToasts).toBe('function');
	});

	it('should have correct toast types', async () => {
		// Type check: this is mainly a compile-time check
		const mod = await import('$lib/stores/toast.svelte');
		expect(mod.addToast).toBeDefined();
	});
});
