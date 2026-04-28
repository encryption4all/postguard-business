<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let reviewNotes = $state('');

	let confirmName = $state('');
	let dialogEl: HTMLDialogElement | null = $state(null);

	function openDelete() {
		confirmName = '';
		dialogEl?.showModal();
	}

	function closeDelete() {
		dialogEl?.close();
		confirmName = '';
	}
</script>

<SEO title="{data.organization.name} - Admin" />

<a href="/admin/organizations" class="back-link">
	<Icon icon="mdi:arrow-left" width="16" height="16" />
	{$_('admin.organizations.backToOrgs')}
</a>

<div class="org-header">
	<h1>{data.organization.name}</h1>
	<span class="status" class:active={data.organization.status === 'active'} class:pending={data.organization.status === 'pending'}>
		{data.organization.status}
	</span>
</div>

<div class="org-details">
	<div class="detail"><span class="label">{$_('admin.organizations.domain')}</span><span>{data.organization.domain}</span></div>
	<div class="detail"><span class="label">{$_('admin.organizations.signingEmail')}</span><span>{data.organization.signingEmail}</span></div>
	<div class="detail"><span class="label">{$_('admin.organizations.kvk')}</span><span>{data.organization.kvkNumber ?? '—'}</span></div>
	<div class="detail"><span class="label">{$_('admin.organizations.contact')}</span><span>{data.contactPerson ? `${data.contactPerson.fullName} (${data.contactPerson.email})` : '—'}</span></div>
</div>

{#if form?.error === 'name_mismatch'}
	<div class="banner error" role="alert">
		<Icon icon="mdi:alert-circle" width="18" height="18" />
		<span>{$_('admin.organizations.deleteFailedNameMismatch')}</span>
	</div>
{/if}

{#if data.impersonationEnabled || data.orgStatusEnabled}
	<div class="admin-actions">
		{#if data.impersonationEnabled}
			<form method="POST" action="?/impersonate" use:enhance>
				<button type="submit" class="secondary-btn">
					<Icon icon="mdi:eye" width="16" height="16" />
					{$_('admin.organizations.impersonate')}
				</button>
			</form>
		{/if}
		{#if data.orgStatusEnabled}
			<button type="button" class="danger-outline-btn" onclick={openDelete}>
				<Icon icon="mdi:delete" width="16" height="16" />
				{$_('admin.organizations.delete')}
			</button>
		{/if}
	</div>
{/if}

<section class="users">
	<h2>Users <span class="count">({data.users.length})</span></h2>
	{#if data.users.length === 0}
		<p class="empty">No users belong to this organisation yet.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Phone</th>
						<th>Contact</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as u (u.id)}
						<tr>
							<td>{u.fullName}</td>
							<td>{u.email}</td>
							<td>{u.phone ?? '—'}</td>
							<td>
								{#if data.organization.contactUserId === u.id}
									<span class="badge">Contact person</span>
								{:else}
									—
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

{#if data.requests.length > 0}
	<section class="requests">
		<h2>{$_('admin.organizations.changeRequests')}</h2>
		{#each data.requests as req}
			<div class="request-card" class:pending={req.status === 'pending'}>
				<div class="request-header">
					<span class="req-field">{req.fieldName}</span>
					<span class="req-status" class:approved={req.status === 'approved'} class:rejected={req.status === 'rejected'} class:pending-status={req.status === 'pending'}>
						{req.status}
					</span>
				</div>
				<div class="req-values">
					<span class="old">{req.oldValue ?? $_('admin.organizations.empty')}</span>
					<Icon icon="mdi:arrow-right" width="14" height="14" />
					<span class="new">{req.newValue}</span>
				</div>
				<p class="req-date">{new Date(req.requestedAt).toLocaleString()}</p>

				{#if req.status === 'pending'}
					<div class="review-form">
						<input
							type="text"
							class="pg-input"
							placeholder={$_('admin.organizations.validationNotes')}
							bind:value={reviewNotes}
						/>
						<div class="review-actions">
							<form method="POST" action="?/approve" use:enhance>
								<input type="hidden" name="requestId" value={req.id} />
								<input type="hidden" name="reviewNotes" value={reviewNotes} />
								<button type="submit" class="action-btn approve">{$_('admin.organizations.approve')}</button>
							</form>
							<form method="POST" action="?/reject" use:enhance>
								<input type="hidden" name="requestId" value={req.id} />
								<input type="hidden" name="reviewNotes" value={reviewNotes} />
								<button type="submit" class="action-btn reject">{$_('admin.organizations.reject')}</button>
							</form>
						</div>
					</div>
				{/if}

				{#if req.reviewNotes}
					<p class="review-notes">
						<Icon icon="mdi:note-text" width="14" height="14" />
						{req.reviewNotes}
					</p>
				{/if}
			</div>
		{/each}
	</section>
{/if}

<dialog
	bind:this={dialogEl}
	class="delete-dialog"
	onclose={() => {
		confirmName = '';
	}}
>
	<form method="POST" action="?/delete" use:enhance>
		<h2>{$_('admin.organizations.deleteConfirmTitle')}</h2>
		<p class="dialog-intro">
			{$_('admin.organizations.deleteConfirmIntro', { values: { name: data.organization.name } })}
		</p>
		<p class="dialog-warn">
			<Icon icon="mdi:alert" width="16" height="16" />
			{$_('admin.organizations.deleteConfirmWarning')}
		</p>
		<label class="dialog-label" for="confirm-name-input">
			{$_('admin.organizations.deleteConfirmLabel')}
		</label>
		<p class="dialog-name-display">
			<code>{data.organization.name}</code>
		</p>
		<input
			id="confirm-name-input"
			type="text"
			class="pg-input"
			name="confirmName"
			bind:value={confirmName}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
		/>
		<div class="dialog-actions">
			<button type="button" class="ghost-btn" onclick={closeDelete}>
				{$_('admin.organizations.cancel')}
			</button>
			<button
				type="submit"
				class="danger-btn"
				disabled={confirmName.trim() !== data.organization.name.trim()}
			>
				{$_('admin.organizations.deleteConfirm')}
			</button>
		</div>
	</form>
</dialog>

<style lang="scss">
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
		text-decoration: none;
		margin-bottom: 1rem;
		&:hover { color: var(--pg-primary); }
	}

	.org-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		h1 { margin: 0; }
	}

	.status {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		padding: 3px 10px;
		border-radius: 100px;
		text-transform: uppercase;
		font-family: var(--pg-font-family);
		&.active { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
		&.pending { background: rgba(180, 83, 9, 0.12); color: #b45309; }
	}

	.org-details {
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.detail {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--pg-strong-background);
		font-size: var(--pg-font-size-md);
		align-items: baseline;
		&:last-child { border-bottom: none; }
	}

	.label {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		font-weight: var(--pg-font-weight-medium);
		text-transform: uppercase;
		font-family: var(--pg-font-family);
	}

	.admin-actions {
		margin-bottom: 2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: var(--pg-border-radius-md);
		padding: 0.6rem 0.85rem;
		margin-bottom: 1rem;
		font-size: var(--pg-font-size-sm);

		&.error { background: rgba(182, 22, 22, 0.08); border: 1px solid var(--pg-input-error); color: var(--pg-input-error); }
	}

	.danger-outline-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 6px 14px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-sm);
		font-weight: var(--pg-font-weight-medium);
		font-family: var(--pg-font-family);
		background: transparent;
		color: var(--pg-input-error);
		border: 1px solid rgba(182, 22, 22, 0.3);
		&:hover { background: rgba(182, 22, 22, 0.08); }
	}

	.delete-dialog {
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.5rem;
		max-width: 28rem;
		width: calc(100% - 2rem);
		background: var(--pg-general-background);
		color: var(--pg-text);

		&::backdrop { background: rgba(0, 0, 0, 0.5); }

		h2 { margin: 0 0 0.75rem; font-size: var(--pg-font-size-lg); }

		.dialog-intro { font-size: var(--pg-font-size-sm); margin: 0 0 0.75rem; }

		.dialog-warn {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			background: rgba(182, 22, 22, 0.08);
			color: var(--pg-input-error);
			border: 1px solid rgba(182, 22, 22, 0.25);
			border-radius: var(--pg-border-radius-md);
			padding: 0.5rem 0.75rem;
			font-size: var(--pg-font-size-sm);
			margin: 0 0 1rem;
		}

		.dialog-label {
			display: block;
			font-size: var(--pg-font-size-xs);
			color: var(--pg-text-secondary);
			text-transform: uppercase;
			font-weight: var(--pg-font-weight-medium);
			margin-bottom: 0.35rem;
			font-family: var(--pg-font-family);
		}

		.dialog-name-display {
			margin: 0 0 0.5rem;
			code {
				display: inline-block;
				background: var(--pg-strong-background);
				color: var(--pg-text);
				border-radius: var(--pg-border-radius-sm);
				padding: 2px 8px;
				font-family: monospace;
				font-size: var(--pg-font-size-sm);
				user-select: all;
			}
		}

		input.pg-input { width: 100%; height: 2.25rem; font-size: var(--pg-font-size-sm); }
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1.25rem;
	}

	.ghost-btn {
		padding: 6px 14px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
		font-family: var(--pg-font-family);
		&:hover { background: var(--pg-soft-background); }
	}

	.danger-btn {
		padding: 6px 14px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-sm);
		font-weight: var(--pg-font-weight-medium);
		background: var(--pg-input-error);
		color: #fff;
		font-family: var(--pg-font-family);
		&:disabled { opacity: 0.4; cursor: not-allowed; }
		&:not(:disabled):hover { opacity: 0.9; }
	}

	.users {
		margin-bottom: 2rem;
		h2 { margin-bottom: 1rem; }
		.count { font-size: var(--pg-font-size-sm); color: var(--pg-text-secondary); font-weight: var(--pg-font-weight-regular); }
		.empty { color: var(--pg-text-secondary); font-size: var(--pg-font-size-sm); }
		.table-wrap { overflow-x: auto; }
		table { width: 100%; border-collapse: collapse; font-size: var(--pg-font-size-sm); }
		th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--pg-strong-background); }
		th { font-size: var(--pg-font-size-xs); color: var(--pg-text-secondary); text-transform: uppercase; font-weight: var(--pg-font-weight-medium); font-family: var(--pg-font-family); }
		.badge { background: rgba(22, 163, 74, 0.12); color: #16a34a; font-size: var(--pg-font-size-xs); font-weight: var(--pg-font-weight-bold); padding: 3px 10px; border-radius: 100px; text-transform: uppercase; font-family: var(--pg-font-family); }
	}

	.requests h2 { margin-bottom: 1rem; }

	.request-card {
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		padding: 1rem;
		margin-bottom: 0.75rem;
		&.pending { border-color: #b45309; background: rgba(180, 83, 9, 0.04); }
	}

	.request-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.req-field { font-weight: var(--pg-font-weight-bold); font-size: var(--pg-font-size-md); font-family: var(--pg-font-family); }

	.req-status {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		text-transform: uppercase;
		font-family: var(--pg-font-family);
		&.approved { color: #16a34a; }
		&.rejected { color: var(--pg-input-error); }
		&.pending-status { color: #b45309; }
	}

	.req-values {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--pg-font-size-sm);
		margin-bottom: 0.5rem;

		.old { color: var(--pg-text-secondary); text-decoration: line-through; }
		.new { color: var(--pg-text); font-weight: var(--pg-font-weight-medium); }
		:global(svg) { color: var(--pg-text-secondary); }
	}

	.req-date { font-size: var(--pg-font-size-xs); color: var(--pg-text-secondary); }

	.review-form {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		input { height: 2rem; font-size: var(--pg-font-size-sm); }
	}

	.review-actions { display: flex; gap: 0.5rem; }

	.action-btn {
		font-size: var(--pg-font-size-sm);
		font-weight: var(--pg-font-weight-medium);
		padding: 6px 16px;
		border-radius: var(--pg-border-radius-sm);
		font-family: var(--pg-font-family);

		&.approve { background: #16a34a; color: #fff; }
		&.approve:hover { background: #15803d; }
		&.reject { background: var(--pg-input-error); color: #fff; }
		&.reject:hover { opacity: 0.9; }
	}

	.review-notes {
		display: flex;
		align-items: start;
		gap: 0.35rem;
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		margin-top: 0.5rem;
		font-style: italic;
	}
</style>
