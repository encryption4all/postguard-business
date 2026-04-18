<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let flags = $derived(data.flags);
	let updating = $state<string | null>(null);

	async function toggleFlag(flag: string, currentValue: boolean) {
		updating = flag;
		const response = await fetch('/api/admin/flags', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ flag, value: !currentValue })
		});
		if (response.ok) {
			const result = await response.json();
			flags = result.flags;
		}
		updating = null;
	}

</script>

<SEO title="Settings - Admin" />

<h1>Settings</h1>

<section class="flags-section">
	<h2>Feature Flags</h2>

	{#if !data.canToggle}
		<div class="prod-notice">
			<Icon icon="mdi:lock" width="18" height="18" />
			<span>Production mode — feature flags are set via environment variables and cannot be changed at runtime.</span>
		</div>
	{/if}

	<div class="flags-list">
		{#each Object.entries(flags) as [flag, info]}
			<div class="flag-row">
				<div class="flag-info">
					<span class="flag-label">{data.labels[flag as keyof typeof data.labels]}</span>
					<span class="flag-key">{flag}</span>
				</div>
				<div class="flag-controls">
					<button
						class="toggle"
						class:on={info.value}
						class:off={!info.value}
						disabled={!data.canToggle || updating === flag}
						onclick={() => toggleFlag(flag, info.value)}
					>
						{info.value ? 'ON' : 'OFF'}
					</button>
					</div>
			</div>
		{/each}
	</div>
</section>

<style lang="scss">
	h1 {
		margin: 0 0 1.5rem;
	}

	.flags-section h2 {
		margin-bottom: 1rem;
	}

	.prod-notice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--pg-soft-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
	}

	.flags-list {
		display: flex;
		flex-direction: column;
	}

	.flag-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--pg-soft-background);
		gap: 1rem;
	}

	.flag-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.flag-label {
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-md);
		font-weight: var(--pg-font-weight-medium);
		color: var(--pg-text);
	}

	.flag-key {
		font-family: monospace;
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
	}

	.flag-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle {
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		padding: 4px 14px;
		border-radius: var(--pg-border-radius-sm);
		min-width: 50px;
		text-align: center;
		transition: background 0.15s, color 0.15s;

		&.on {
			background: rgba(22, 163, 74, 0.15);
			color: #16a34a;
		}

		&.off {
			background: rgba(182, 22, 22, 0.1);
			color: var(--pg-input-error);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

</style>
