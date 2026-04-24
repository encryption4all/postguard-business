<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO title="{$_('admin.auditLog.title')} - Admin" />

<h1>{$_('admin.auditLog.title')}</h1>
<p class="subtitle">{$_('admin.auditLog.actionsLogged', { values: { count: data.auditLog.total } })}</p>

{#if data.auditLog.logs.length === 0}
	<p class="empty">{$_('admin.auditLog.noActions')}</p>
{:else}
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>{$_('admin.auditLog.admin')}</th>
					<th>{$_('admin.auditLog.action')}</th>
					<th>{$_('admin.auditLog.target')}</th>
					<th>{$_('admin.auditLog.details')}</th>
					<th>{$_('admin.auditLog.ip')}</th>
					<th>{$_('admin.auditLog.time')}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.auditLog.logs as entry}
					<tr>
						<td>{entry.adminName}</td>
						<td><code>{entry.log.action}</code></td>
						<td>
							{#if entry.log.targetType}
								<span class="target">{entry.log.targetType}</span>
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td class="details">
							{#if entry.log.details && Object.keys(entry.log.details as object).length > 0}
								<code>{JSON.stringify(entry.log.details)}</code>
							{:else}
								<span class="muted">—</span>
							{/if}
						</td>
						<td>{entry.log.ipAddress ?? '—'}</td>
						<td>{new Date(entry.log.createdAt).toLocaleString()}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.auditLog.totalPages > 1}
		<div class="pagination">
			{#if data.auditLog.page > 1}
				<a href="/admin/audit-log?page={data.auditLog.page - 1}" class="secondary-btn">{$_('admin.auditLog.previous')}</a>
			{/if}
			<span class="page-info">{$_('admin.auditLog.pageOf', { values: { page: data.auditLog.page, totalPages: data.auditLog.totalPages } })}</span>
			{#if data.auditLog.page < data.auditLog.totalPages}
				<a href="/admin/audit-log?page={data.auditLog.page + 1}" class="secondary-btn">{$_('admin.auditLog.next')}</a>
			{/if}
		</div>
	{/if}
{/if}

<style lang="scss">
	h1 { margin: 0 0 0.25rem; }
	.subtitle { color: var(--pg-text-secondary); font-size: var(--pg-font-size-sm); margin-bottom: 1.5rem; }
	.empty { color: var(--pg-text-secondary); }
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

	code {
		font-family: monospace;
		font-size: var(--pg-font-size-xs);
		background: var(--pg-soft-background);
		padding: 1px 4px;
		border-radius: 2px;
	}

	.target { font-size: var(--pg-font-size-xs); color: var(--pg-text-secondary); }
	.details { max-width: 250px; overflow: hidden; text-overflow: ellipsis; }
	.muted { color: var(--pg-text-secondary); }

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.page-info { font-size: var(--pg-font-size-sm); color: var(--pg-text-secondary); }
</style>
