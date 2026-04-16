<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let confirmDelete = $state<string | null>(null);
</script>

<SEO title="API Keys" />

<div class="page-header">
	<h1>API Keys</h1>
	<a href="/portal/api-keys/create" class="primary-btn">
		<Icon icon="mdi:plus" width="18" height="18" />
		Create key
	</a>
</div>

{#if data.keys.length === 0}
	<div class="empty-state">
		<Icon icon="mdi:key-variant" width="48" height="48" />
		<h3>No API keys yet</h3>
		<p>Create your first API key to start signing emails.</p>
		<a href="/portal/api-keys/create" class="secondary-btn">Create API key</a>
	</div>
{:else}
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Key prefix</th>
					<th>Created</th>
					<th>Last used</th>
					<th>Expires</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.keys as key}
					<tr>
						<td class="key-name">{key.name}</td>
						<td><code>{key.keyPrefix}...</code></td>
						<td>{new Date(key.createdAt).toLocaleDateString()}</td>
						<td>
							{#if key.lastUsedAt}
								{new Date(key.lastUsedAt).toLocaleDateString()}
							{:else}
								<span class="muted">Never</span>
							{/if}
						</td>
						<td>{new Date(key.expiresAt).toLocaleDateString()}</td>
						<td>
							{#if confirmDelete === key.id}
								<form method="POST" action="?/revoke" use:enhance>
									<input type="hidden" name="keyId" value={key.id} />
									<div class="confirm-row">
										<button type="submit" class="danger-btn">Confirm</button>
										<button type="button" class="ghost-btn" onclick={() => (confirmDelete = null)}>
											Cancel
										</button>
									</div>
								</form>
							{:else}
								<button class="ghost-btn danger" onclick={() => (confirmDelete = key.id)}>
									<Icon icon="mdi:delete" width="18" height="18" />
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style lang="scss">
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;

		h1 {
			margin: 0;
		}
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--pg-text-secondary);

		:global(svg) {
			color: var(--pg-strong-background);
			margin-bottom: 1rem;
		}

		h3 {
			color: var(--pg-text);
			margin-bottom: 0.5rem;
		}

		p {
			margin-bottom: 1.5rem;
		}
	}

	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-md);
	}

	th {
		text-align: left;
		font-weight: var(--pg-font-weight-medium);
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--pg-strong-background);
		white-space: nowrap;
	}

	td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--pg-soft-background);
		white-space: nowrap;
	}

	.key-name {
		font-weight: var(--pg-font-weight-medium);
	}

	code {
		font-family: monospace;
		font-size: var(--pg-font-size-sm);
		background: var(--pg-soft-background);
		padding: 2px 6px;
		border-radius: var(--pg-border-radius-sm);
	}

	.muted {
		color: var(--pg-text-secondary);
		font-size: var(--pg-font-size-sm);
	}

	.confirm-row {
		display: flex;
		gap: 0.5rem;
	}

	.ghost-btn {
		padding: 4px 8px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);

		&:hover {
			background: var(--pg-soft-background);
		}

		&.danger {
			color: var(--pg-input-error);
		}
	}

	.danger-btn {
		padding: 4px 12px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-sm);
		font-weight: var(--pg-font-weight-medium);
		background: var(--pg-input-error);
		color: #fff;
	}
</style>
