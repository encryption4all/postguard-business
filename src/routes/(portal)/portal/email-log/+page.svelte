<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let searchInput = $derived(data.search);
	let confirmRevoke = $state<string | null>(null);

	function search() {
		const params = new URLSearchParams();
		if (searchInput) params.set('search', searchInput);
		goto(`/portal/email-log?${params.toString()}`);
	}
</script>

<SEO title={$_('emailLog.title')} />

<div class="page-header">
	<h1>{$_('emailLog.heading')}</h1>
</div>

<div class="search-bar">
	<form onsubmit={(e) => { e.preventDefault(); search(); }}>
		<div class="search-row">
			<input
				type="text"
				class="pg-input"
				placeholder={$_('emailLog.searchPlaceholder')}
				bind:value={searchInput}
			/>
			<button type="submit" class="secondary-btn">
				<Icon icon="mdi:magnify" width="18" height="18" />
				{$_('emailLog.search')}
			</button>
		</div>
	</form>
	<p class="result-count">{$_('emailLog.emailsFound', { values: { count: data.emailLogs.total } })}</p>
</div>

{#if data.emailLogs.logs.length === 0}
	<div class="empty-state">
		<Icon icon="mdi:email-search" width="48" height="48" />
		<h3>{$_('emailLog.noEmails')}</h3>
		<p>
			{#if data.search}
				{$_('emailLog.noSearchMatch')}
			{:else}
				{$_('emailLog.noEmailsYet')}
			{/if}
		</p>
	</div>
{:else}
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>{$_('emailLog.recipient')}</th>
					<th>{$_('emailLog.subject')}</th>
					<th>{$_('emailLog.signed')}</th>
					<th>{$_('emailLog.read')}</th>
					<th>{$_('emailLog.statusCol')}</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.emailLogs.logs as email}
					<tr>
						<td>{email.recipient}</td>
						<td class="subject">{email.subject ?? '—'}</td>
						<td>{new Date(email.signedAt).toLocaleString()}</td>
						<td>
							{#if email.readAt}
								<span class="read-badge">
									<Icon icon="mdi:check-all" width="14" height="14" />
									{new Date(email.readAt).toLocaleDateString()}
								</span>
							{:else}
								<span class="muted">{$_('emailLog.notRead')}</span>
							{/if}
						</td>
						<td>
							{#if email.revokedAt}
								<span class="revoked-badge">{$_('emailLog.revoked')}</span>
							{:else}
								<span class="active-badge">{$_('emailLog.active')}</span>
							{/if}
						</td>
						<td>
							{#if !email.revokedAt}
								{#if confirmRevoke === email.id}
									<form method="POST" action="?/revoke" use:enhance>
										<input type="hidden" name="emailId" value={email.id} />
										<div class="confirm-row">
											<button type="submit" class="danger-btn">{$_('emailLog.revoke')}</button>
											<button type="button" class="ghost-btn" onclick={() => (confirmRevoke = null)}>
												{$_('emailLog.cancel')}
											</button>
										</div>
									</form>
								{:else}
									<button class="ghost-btn danger" onclick={() => (confirmRevoke = email.id)}>
										{$_('emailLog.revoke')}
									</button>
								{/if}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.emailLogs.totalPages > 1}
		<div class="pagination">
			{#if data.emailLogs.page > 1}
				<a href="/portal/email-log?page={data.emailLogs.page - 1}{data.search ? `&search=${data.search}` : ''}" class="secondary-btn">
					{$_('emailLog.previous')}
				</a>
			{/if}
			<span class="page-info">{$_('emailLog.pageOf', { values: { page: data.emailLogs.page, totalPages: data.emailLogs.totalPages } })}</span>
			{#if data.emailLogs.page < data.emailLogs.totalPages}
				<a href="/portal/email-log?page={data.emailLogs.page + 1}{data.search ? `&search=${data.search}` : ''}" class="secondary-btn">
					{$_('emailLog.next')}
				</a>
			{/if}
		</div>
	{/if}
{/if}

<style lang="scss">
	.page-header {
		margin-bottom: 1rem;

		h1 { margin: 0; }
	}

	.search-bar {
		margin-bottom: 1.5rem;
	}

	.search-row {
		display: flex;
		gap: 0.5rem;

		input { flex: 1; }
	}

	.result-count {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		margin-top: 0.5rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--pg-text-secondary);

		:global(svg) { color: var(--pg-strong-background); margin-bottom: 1rem; }
		h3 { color: var(--pg-text); margin-bottom: 0.5rem; }
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

	.subject { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
	.muted { color: var(--pg-text-secondary); }

	.read-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: #16a34a;
		font-size: var(--pg-font-size-xs);
	}

	.active-badge {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		color: #16a34a;
	}

	.revoked-badge {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		color: var(--pg-input-error);
	}

	.confirm-row { display: flex; gap: 0.5rem; }

	.ghost-btn {
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
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.page-info {
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
	}
</style>
