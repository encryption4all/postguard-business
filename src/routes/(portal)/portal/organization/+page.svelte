<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editingField = $state<string | null>(null);
	let editValue = $state('');

	const org = $derived(data.organization);

	const fields = $derived([
		{ key: 'name', label: 'Organization name', value: org.name },
		{ key: 'domain', label: 'Domain', value: org.domain },
		{ key: 'email', label: 'Contact email', value: org.email },
		{ key: 'contactName', label: 'Contact person', value: org.contactName },
		{ key: 'phone', label: 'Phone number', value: org.phone ?? '—' },
		{ key: 'kvkNumber', label: 'KVK number', value: org.kvkNumber ?? '—' }
	]);

	function startEdit(key: string, currentValue: string) {
		editingField = key;
		editValue = currentValue === '—' ? '' : currentValue;
	}

	function cancelEdit() {
		editingField = null;
		editValue = '';
	}
</script>

<SEO title="Organization" />

<h1>Organization Details</h1>

{#if form?.submitted}
	<div class="success-banner" role="status">
		<Icon icon="mdi:check-circle" width="20" height="20" />
		<span>Change request for <strong>{form.fieldName}</strong> submitted. An admin will review it.</span>
	</div>
{/if}

<div class="info-card">
	<div class="status-row">
		<span class="status-badge" class:active={org.status === 'active'} class:pending={org.status === 'pending'}>
			{org.status}
		</span>
	</div>

	{#each fields as field}
		<div class="field-row">
			<div class="field-info">
				<span class="field-label">{field.label}</span>
				<span class="field-value">{field.value}</span>
			</div>
			{#if editingField === field.key}
				<form method="POST" action="?/requestChange" use:enhance={() => {
					return async ({ update }) => {
						cancelEdit();
						await update();
					};
				}}>
					<input type="hidden" name="fieldName" value={field.key} />
					<input type="hidden" name="oldValue" value={field.value} />
					<div class="edit-row">
						<input
							name="newValue"
							type="text"
							class="pg-input edit-input"
							bind:value={editValue}
							placeholder="New value"
							required
						/>
						<button type="submit" class="ghost-btn submit-edit">
							<Icon icon="mdi:send" width="18" height="18" />
						</button>
						<button type="button" class="ghost-btn" onclick={cancelEdit}>
							<Icon icon="mdi:close" width="18" height="18" />
						</button>
					</div>
				</form>
			{:else}
				<button class="ghost-btn edit-btn" onclick={() => startEdit(field.key, field.value)}>
					<Icon icon="mdi:pencil" width="16" height="16" />
					Request change
				</button>
			{/if}
		</div>
	{/each}
</div>

{#if data.requests.length > 0}
	<section class="requests-section">
		<h2>Change Requests</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Field</th>
						<th>New value</th>
						<th>Status</th>
						<th>Requested</th>
					</tr>
				</thead>
				<tbody>
					{#each data.requests as req}
						<tr>
							<td>{req.fieldName}</td>
							<td>{req.newValue}</td>
							<td>
								<span class="req-status" class:approved={req.status === 'approved'} class:rejected={req.status === 'rejected'} class:pending={req.status === 'pending'}>
									{req.status}
								</span>
							</td>
							<td>{new Date(req.requestedAt).toLocaleDateString()}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

<style lang="scss">
	h1 {
		margin: 0 0 1.5rem;
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

	.info-card {
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.5rem;
	}

	.status-row {
		margin-bottom: 1rem;
	}

	.status-badge {
		display: inline-block;
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		padding: 3px 10px;
		border-radius: 100px;
		text-transform: uppercase;

		&.active {
			background: rgba(22, 163, 74, 0.12);
			color: #16a34a;
		}
		&.pending {
			background: rgba(180, 83, 9, 0.12);
			color: #b45309;
		}
	}

	.field-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--pg-strong-background);
		gap: 1rem;

		&:last-child {
			border-bottom: none;
		}
	}

	.field-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.field-label {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: var(--pg-font-weight-medium);
		font-family: var(--pg-font-family);
	}

	.field-value {
		font-size: var(--pg-font-size-md);
		font-weight: var(--pg-font-weight-medium);
		color: var(--pg-text);
		font-family: var(--pg-font-family);
	}

	.edit-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: var(--pg-font-size-xs);
		color: var(--pg-primary);
		white-space: nowrap;
		font-family: var(--pg-font-family);

		&:hover {
			background: var(--pg-strong-background);
			border-radius: var(--pg-border-radius-sm);
			padding: 4px 8px;
		}
	}

	.edit-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.edit-input {
		width: 200px;
		height: 2rem;
		font-size: var(--pg-font-size-sm);
	}

	.submit-edit {
		color: var(--pg-primary);
	}

	.ghost-btn {
		padding: 4px 8px;
		border-radius: var(--pg-border-radius-sm);
		font-family: var(--pg-font-family);
		color: var(--pg-text-secondary);

		&:hover {
			background: var(--pg-strong-background);
		}
	}

	.requests-section {
		margin-top: 2rem;

		h2 {
			margin-bottom: 1rem;
		}
	}

	.table-wrapper {
		overflow-x: auto;
	}

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
	}

	td {
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--pg-soft-background);
	}

	.req-status {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		text-transform: uppercase;

		&.approved { color: #16a34a; }
		&.rejected { color: var(--pg-input-error); }
		&.pending { color: #b45309; }
	}
</style>
