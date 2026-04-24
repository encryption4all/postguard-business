<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO title="{$_('admin.organizations.title')} - Admin" />

<h1>{$_('admin.organizations.title')}</h1>

{#if data.pendingRequests.length > 0}
	<section class="pending-section">
		<h2>
			<Icon icon="mdi:bell-ring" width="20" height="20" />
			{$_('admin.organizations.pendingRequests', { values: { count: data.pendingRequests.length } })}
		</h2>
		<div class="pending-list">
			{#each data.pendingRequests as item}
				<a href="/admin/organizations/{item.request.orgId}" class="pending-card">
					<div>
						<span class="pending-org">{item.orgName}</span>
						<span class="pending-field">{item.request.fieldName} &rarr; {item.request.newValue}</span>
					</div>
					<span class="pending-date">{new Date(item.request.requestedAt).toLocaleDateString()}</span>
				</a>
			{/each}
		</div>
	</section>
{/if}

<section>
	<h2>{$_('admin.organizations.allOrgs')}</h2>
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>{$_('admin.organizations.name')}</th>
					<th>{$_('admin.organizations.domain')}</th>
					<th>{$_('admin.organizations.signingEmail')}</th>
					{#if data.orgStatusEnabled}<th>{$_('admin.organizations.status')}</th>{/if}
					<th>{$_('admin.organizations.created')}</th>
					{#if data.orgStatusEnabled}<th></th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each data.organizations as org}
					<tr>
						<td><a href="/admin/organizations/{org.id}" class="org-link">{org.name}</a></td>
						<td>{org.domain}</td>
						<td>{org.signingEmail}</td>
						{#if data.orgStatusEnabled}
							<td>
								<span class="status" class:active={org.status === 'active'} class:pending={org.status === 'pending'} class:suspended={org.status === 'suspended'}>
									{$_(`admin.organizations.${org.status}`)}
								</span>
							</td>
						{/if}
						<td>{new Date(org.createdAt).toLocaleDateString()}</td>
						{#if data.orgStatusEnabled}
							<td class="actions">
								{#if org.status === 'pending'}
									<form method="POST" action="?/activate" use:enhance>
										<input type="hidden" name="orgId" value={org.id} />
										<button type="submit" class="action-btn approve">{$_('admin.organizations.activate')}</button>
									</form>
								{:else if org.status === 'active'}
									<form method="POST" action="?/suspend" use:enhance>
										<input type="hidden" name="orgId" value={org.id} />
										<button type="submit" class="action-btn suspend">{$_('admin.organizations.suspend')}</button>
									</form>
								{:else}
									<form method="POST" action="?/activate" use:enhance>
										<input type="hidden" name="orgId" value={org.id} />
										<button type="submit" class="action-btn approve">{$_('admin.organizations.reactivate')}</button>
									</form>
								{/if}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style lang="scss">
	h1 { margin: 0 0 1.5rem; }

	.pending-section {
		margin-bottom: 2rem;

		h2 {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			color: #b45309;
			margin-bottom: 1rem;

			:global(svg) { color: #b45309; }
		}
	}

	.pending-list { display: flex; flex-direction: column; gap: 0.5rem; }

	.pending-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(180, 83, 9, 0.06);
		border: 1px solid rgba(180, 83, 9, 0.2);
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		text-decoration: none;
		transition: background 0.15s;
		&:hover { background: rgba(180, 83, 9, 0.1); }
	}

	.pending-org { font-weight: var(--pg-font-weight-medium); color: var(--pg-text); display: block; }
	.pending-field { font-size: var(--pg-font-size-sm); color: var(--pg-text-secondary); }
	.pending-date { font-size: var(--pg-font-size-xs); color: var(--pg-text-secondary); }

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

	.org-link { color: var(--pg-primary); font-weight: var(--pg-font-weight-medium); }

	.status {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		text-transform: uppercase;
		&.active { color: #16a34a; }
		&.pending { color: #b45309; }
		&.suspended { color: var(--pg-input-error); }
	}

	.actions { white-space: nowrap; }

	.action-btn {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-medium);
		padding: 3px 10px;
		border-radius: var(--pg-border-radius-sm);
		font-family: var(--pg-font-family);

		&.approve { background: rgba(22, 163, 74, 0.1); color: #16a34a; }
		&.approve:hover { background: rgba(22, 163, 74, 0.2); }
		&.suspend { background: rgba(182, 22, 22, 0.1); color: var(--pg-input-error); }
		&.suspend:hover { background: rgba(182, 22, 22, 0.2); }
	}
</style>
