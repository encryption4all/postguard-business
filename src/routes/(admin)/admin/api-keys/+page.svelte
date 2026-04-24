<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let confirmRevoke = $state<string | null>(null);
</script>

<SEO title="{$_('admin.apiKeys.title')} - Admin" />

<h1>{$_('admin.apiKeys.title')}</h1>

{#if form?.created && form?.rawKey}
	<div class="key-banner">
		<Icon icon="mdi:key-chain" width="20" height="20" />
		<span>{$_('admin.apiKeys.keyCreated', { values: { rawKey: form.rawKey } })}</span>
	</div>
{/if}

{#if data.keys.length === 0}
	<p class="empty">{$_('admin.apiKeys.noKeys')}</p>
{:else}
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>{$_('admin.apiKeys.organization')}</th>
					<th>{$_('admin.apiKeys.keyName')}</th>
					<th>{$_('admin.apiKeys.prefix')}</th>
					<th>{$_('admin.apiKeys.created')}</th>
					<th>{$_('admin.apiKeys.lastUsed')}</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.keys as item}
					<tr>
						<td>{item.orgName} <span class="domain">({item.orgDomain})</span></td>
						<td class="key-name">{item.key.name}</td>
						<td><code>{item.key.keyPrefix}...</code></td>
						<td>{new Date(item.key.createdAt).toLocaleDateString()}</td>
						<td>
							{#if item.key.lastUsedAt}
								{new Date(item.key.lastUsedAt).toLocaleDateString()}
							{:else}
								<span class="muted">{$_('admin.apiKeys.never')}</span>
							{/if}
						</td>
						<td>
							{#if confirmRevoke === item.key.id}
								<form method="POST" action="?/revoke" use:enhance>
									<input type="hidden" name="keyId" value={item.key.id} />
									<div class="confirm-row">
										<button type="submit" class="danger-btn">{$_('admin.apiKeys.confirm')}</button>
										<button type="button" class="ghost-btn" onclick={() => (confirmRevoke = null)}>{$_('admin.apiKeys.cancel')}</button>
									</div>
								</form>
							{:else}
								<button class="ghost-btn danger" onclick={() => (confirmRevoke = item.key.id)}>
									<Icon icon="mdi:delete" width="16" height="16" />
									{$_('admin.apiKeys.revoke')}
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
	h1 { margin: 0 0 1.5rem; }
	.empty { color: var(--pg-text-secondary); }

	.key-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid #16a34a;
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		font-size: var(--pg-font-size-sm);
		color: #16a34a;
	}

	.table-wrapper { overflow-x: auto; }

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-sm);
	}

	th {
		text-align: left;
		font-weight: var(--pg-font-weight-medium);
		color: var(--pg-text-secondary);
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid var(--pg-strong-background);
		white-space: nowrap;
	}

	td {
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--pg-soft-background);
		white-space: nowrap;
	}

	.domain { font-size: var(--pg-font-size-xs); color: var(--pg-text-secondary); }
	.key-name { font-weight: var(--pg-font-weight-medium); }
	.muted { color: var(--pg-text-secondary); }

	code {
		font-family: monospace;
		font-size: var(--pg-font-size-xs);
		background: var(--pg-soft-background);
		padding: 1px 4px;
		border-radius: 2px;
	}

	.confirm-row { display: flex; gap: 0.5rem; }

	.ghost-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 4px 8px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		font-family: var(--pg-font-family);
		&:hover { background: var(--pg-soft-background); }
		&.danger { color: var(--pg-input-error); }
	}

	.danger-btn {
		padding: 4px 12px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-medium);
		background: var(--pg-input-error);
		color: #fff;
		font-family: var(--pg-font-family);
	}
</style>
