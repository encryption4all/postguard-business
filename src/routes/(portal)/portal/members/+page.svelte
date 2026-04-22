<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let showAddForm = $state(false);
	let confirmRemove = $state<string | null>(null);
</script>

<SEO title="Members" />

<div class="page-header">
	<h1>Members</h1>
	<button class="primary-btn" onclick={() => (showAddForm = !showAddForm)}>
		<Icon icon="mdi:plus" width="18" height="18" />
		Add member
	</button>
</div>

{#if form?.error}
	<div class="error-banner" role="alert">
		<Icon icon="mdi:alert-circle" width="20" height="20" />
		<span>{form.error}</span>
	</div>
{/if}

{#if form?.added}
	<div class="success-banner" role="status">
		<Icon icon="mdi:check-circle" width="20" height="20" />
		<span>Member added successfully.</span>
	</div>
{/if}

{#if form?.contactChanged}
	<div class="success-banner" role="status">
		<Icon icon="mdi:check-circle" width="20" height="20" />
		<span>Contact person updated.</span>
	</div>
{/if}

{#if showAddForm}
	<div class="add-form-card">
		<h3>Add a new member</h3>
		<form method="POST" action="?/add" use:enhance={() => {
			return async ({ update, result }) => {
				if (result.type === 'success') showAddForm = false;
				await update();
			};
		}}>
			<div class="form-row">
				<label for="fullName">Full name</label>
				<input id="fullName" name="fullName" type="text" class="pg-input" required />
			</div>
			<div class="form-row">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" class="pg-input" required />
			</div>
			<div class="form-row">
				<label for="phone">Phone <span class="optional">(optional)</span></label>
				<input id="phone" name="phone" type="tel" class="pg-input" />
			</div>
			<div class="form-actions">
				<button type="submit" class="primary-btn">Add member</button>
				<button type="button" class="ghost-btn" onclick={() => (showAddForm = false)}>Cancel</button>
			</div>
		</form>
	</div>
{/if}

{#if data.members.length === 0}
	<div class="empty-state">
		<Icon icon="mdi:account-group" width="48" height="48" />
		<h3>No members yet</h3>
		<p>Add the first member to your organization.</p>
	</div>
{:else}
	<div class="table-wrapper">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Phone</th>
					<th>Role</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.members as member}
					<tr>
						<td class="member-name">{member.fullName}</td>
						<td>{member.email}</td>
						<td>{member.phone ?? '—'}</td>
						<td>
							{#if member.id === data.organization.contactUserId}
								<span class="contact-badge">Contact person</span>
							{:else}
								<span class="muted">Member</span>
							{/if}
						</td>
						<td class="actions-cell">
							{#if member.id !== data.organization.contactUserId}
								<form method="POST" action="?/setContact" use:enhance class="inline-form">
									<input type="hidden" name="userId" value={member.id} />
									<button type="submit" class="ghost-btn" title="Make contact person">
										<Icon icon="mdi:account-star" width="18" height="18" />
									</button>
								</form>
							{/if}
							{#if confirmRemove === member.id}
								<form method="POST" action="?/remove" use:enhance>
									<input type="hidden" name="userId" value={member.id} />
									<div class="confirm-row">
										<button type="submit" class="danger-btn">Remove</button>
										<button type="button" class="ghost-btn" onclick={() => (confirmRemove = null)}>Cancel</button>
									</div>
								</form>
							{:else if member.id !== data.organization.contactUserId && member.id !== data.user?.id}
								<button class="ghost-btn danger" onclick={() => (confirmRemove = member.id)} title="Remove member">
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

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(220, 38, 38, 0.08);
		border: 1px solid var(--pg-input-error);
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		color: var(--pg-input-error);
		font-size: var(--pg-font-size-sm);
	}

	.success-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid #16a34a;
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		color: #16a34a;
		font-size: var(--pg-font-size-sm);
	}

	.add-form-card {
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.5rem;

		h3 {
			margin: 0 0 1rem;
		}
	}

	.form-row {
		margin-bottom: 1rem;

		label {
			display: block;
			font-size: var(--pg-font-size-sm);
			font-weight: var(--pg-font-weight-medium);
			margin-bottom: 0.25rem;
			font-family: var(--pg-font-family);
		}

		.optional {
			color: var(--pg-text-secondary);
			font-weight: normal;
		}

		.pg-input {
			width: 100%;
			max-width: 360px;
		}
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
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

	tr {
		border-bottom: 1px solid var(--pg-soft-background);
	}

	td {
		padding: 0.75rem;
		white-space: nowrap;
	}

	.member-name {
		font-weight: var(--pg-font-weight-medium);
	}

	.muted {
		color: var(--pg-text-secondary);
		font-size: var(--pg-font-size-sm);
	}

	.contact-badge {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		background: rgba(22, 163, 74, 0.12);
		color: #16a34a;
		padding: 3px 10px;
		border-radius: 100px;
		text-transform: uppercase;
	}

	.actions-cell {
		display: flex;
		align-items: center;
		gap: 0.25rem;

		:global(svg) {
			display: block;
		}

		.ghost-btn {
			padding: 2px 4px;
			line-height: 1;
		}
	}

	.inline-form {
		display: flex;
		align-items: center;
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
