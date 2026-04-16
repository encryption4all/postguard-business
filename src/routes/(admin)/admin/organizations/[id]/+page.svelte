<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let reviewNotes = $state('');
</script>

<SEO title="{data.organization.name} - Admin" />

<a href="/admin/organizations" class="back-link">
	<Icon icon="mdi:arrow-left" width="16" height="16" />
	Back to organizations
</a>

<div class="org-header">
	<h1>{data.organization.name}</h1>
	<span class="status" class:active={data.organization.status === 'active'} class:pending={data.organization.status === 'pending'}>
		{data.organization.status}
	</span>
</div>

<div class="org-details">
	<div class="detail"><span class="label">Domain</span><span>{data.organization.domain}</span></div>
	<div class="detail"><span class="label">Email</span><span>{data.organization.email}</span></div>
	<div class="detail"><span class="label">Contact</span><span>{data.organization.contactName}</span></div>
	<div class="detail"><span class="label">Phone</span><span>{data.organization.phone ?? '—'}</span></div>
	<div class="detail"><span class="label">KVK</span><span>{data.organization.kvkNumber ?? '—'}</span></div>
</div>

{#if data.impersonationEnabled}
	<div class="admin-actions">
		<form method="POST" action="?/impersonate" use:enhance>
			<button type="submit" class="secondary-btn">
				<Icon icon="mdi:eye" width="16" height="16" />
				Impersonate
			</button>
		</form>
	</div>
{/if}

{#if data.requests.length > 0}
	<section class="requests">
		<h2>Change Requests</h2>
		{#each data.requests as req}
			<div class="request-card" class:pending={req.status === 'pending'}>
				<div class="request-header">
					<span class="req-field">{req.fieldName}</span>
					<span class="req-status" class:approved={req.status === 'approved'} class:rejected={req.status === 'rejected'} class:pending-status={req.status === 'pending'}>
						{req.status}
					</span>
				</div>
				<div class="req-values">
					<span class="old">{req.oldValue ?? '(empty)'}</span>
					<Icon icon="mdi:arrow-right" width="14" height="14" />
					<span class="new">{req.newValue}</span>
				</div>
				<p class="req-date">{new Date(req.requestedAt).toLocaleString()}</p>

				{#if req.status === 'pending'}
					<div class="review-form">
						<input
							type="text"
							class="pg-input"
							placeholder="Validation notes (what did you check?)"
							bind:value={reviewNotes}
						/>
						<div class="review-actions">
							<form method="POST" action="?/approve" use:enhance>
								<input type="hidden" name="requestId" value={req.id} />
								<input type="hidden" name="reviewNotes" value={reviewNotes} />
								<button type="submit" class="action-btn approve">Approve</button>
							</form>
							<form method="POST" action="?/reject" use:enhance>
								<input type="hidden" name="requestId" value={req.id} />
								<input type="hidden" name="reviewNotes" value={reviewNotes} />
								<button type="submit" class="action-btn reject">Reject</button>
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
		display: flex;
		gap: 1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--pg-strong-background);
		font-size: var(--pg-font-size-md);
		&:last-child { border-bottom: none; }
	}

	.label {
		min-width: 80px;
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		font-weight: var(--pg-font-weight-medium);
		text-transform: uppercase;
		font-family: var(--pg-font-family);
	}

	.admin-actions { margin-bottom: 2rem; }

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
