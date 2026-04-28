<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let deleteTarget = $state<{ id: string; name: string } | null>(null);
	let confirmName = $state('');
	let dialogEl: HTMLDialogElement | null = $state(null);

	let showCreate = $state(false);

	function openDelete(id: string, name: string) {
		deleteTarget = { id, name };
		confirmName = '';
		dialogEl?.showModal();
	}

	function closeDelete() {
		dialogEl?.close();
		deleteTarget = null;
		confirmName = '';
	}

	$effect(() => {
		if (form?.created) showCreate = false;
	});
</script>

<SEO title="{$_('admin.organizations.title')} - Admin" />

<h1>{$_('admin.organizations.title')}</h1>

{#if form?.deleted}
	<div class="banner success" role="status">
		<Icon icon="mdi:check-circle" width="18" height="18" />
		<span>{$_('admin.organizations.deleteSuccess', { values: { name: form.orgName } })}</span>
	</div>
{:else if form?.created}
	<div class="banner success" role="status">
		<Icon icon="mdi:check-circle" width="18" height="18" />
		<span>{$_('admin.organizations.createSuccess', { values: { name: form.createdName } })}</span>
	</div>
{:else if form?.error === 'name_mismatch'}
	<div class="banner error" role="alert">
		<Icon icon="mdi:alert-circle" width="18" height="18" />
		<span>{$_('admin.organizations.deleteFailedNameMismatch')}</span>
	</div>
{/if}

{#if data.orgStatusEnabled}
	<section class="create-section">
		<button
			type="button"
			class="action-btn approve toggle-create"
			onclick={() => (showCreate = !showCreate)}
			aria-expanded={showCreate}
		>
			<Icon icon={showCreate ? 'mdi:close' : 'mdi:plus'} width="14" height="14" />
			{showCreate ? $_('admin.organizations.cancel') : $_('admin.organizations.addOrg')}
		</button>

		{#if showCreate}
			<form method="POST" action="?/create" class="create-form" use:enhance>
				<h2>{$_('admin.organizations.addOrg')}</h2>

				{#if form?.createErrors?.form}
					<div class="banner error" role="alert">
						<Icon icon="mdi:alert-circle" width="18" height="18" />
						<span>{$_(`admin.organizations.${form.createErrors.form}`)}</span>
					</div>
				{/if}

				<div class="grid">
					<label>
						<span>{$_('admin.organizations.name')}</span>
						<input
							type="text"
							class="pg-input"
							name="name"
							required
							value={form?.createValues?.name ?? ''}
						/>
						{#if form?.createErrors?.name}
							<span class="field-err">{$_(`admin.organizations.${form.createErrors.name}`)}</span>
						{/if}
					</label>

					<label>
						<span>{$_('admin.organizations.domain')}</span>
						<input
							type="text"
							class="pg-input"
							name="domain"
							required
							placeholder="example.com"
							value={form?.createValues?.domain ?? ''}
						/>
						{#if form?.createErrors?.domain}
							<span class="field-err">{$_(`admin.organizations.${form.createErrors.domain}`)}</span>
						{/if}
					</label>

					<label>
						<span>{$_('admin.organizations.signingEmail')}</span>
						<input
							type="email"
							class="pg-input"
							name="signingEmail"
							required
							placeholder="signing@example.com"
							value={form?.createValues?.signingEmail ?? ''}
						/>
						{#if form?.createErrors?.signingEmail}
							<span class="field-err"
								>{$_(`admin.organizations.${form.createErrors.signingEmail}`)}</span
							>
						{/if}
					</label>

					<label>
						<span>{$_('admin.organizations.kvk')}</span>
						<input
							type="text"
							class="pg-input"
							name="kvkNumber"
							value={form?.createValues?.kvkNumber ?? ''}
						/>
					</label>

					<label>
						<span>{$_('admin.organizations.status')}</span>
						<select class="pg-input" name="status" value={form?.createValues?.status ?? 'active'}>
							<option value="active">{$_('admin.organizations.active')}</option>
							<option value="pending">{$_('admin.organizations.pending')}</option>
							<option value="suspended">{$_('admin.organizations.suspended')}</option>
						</select>
					</label>
				</div>

				<div class="create-actions">
					<button type="submit" class="action-btn approve">
						{$_('admin.organizations.createSubmit')}
					</button>
				</div>
			</form>
		{/if}
	</section>
{/if}

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
								<button
									type="button"
									class="action-btn delete"
									onclick={() => openDelete(org.id, org.name)}
								>
									<Icon icon="mdi:delete" width="14" height="14" />
									{$_('admin.organizations.delete')}
								</button>
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<dialog
	bind:this={dialogEl}
	class="delete-dialog"
	onclose={() => {
		deleteTarget = null;
		confirmName = '';
	}}
>
	{#if deleteTarget}
		<form
			method="POST"
			action="?/delete"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					dialogEl?.close();
				};
			}}
		>
			<h2>{$_('admin.organizations.deleteConfirmTitle')}</h2>
			<p class="dialog-intro">
				{$_('admin.organizations.deleteConfirmIntro', { values: { name: deleteTarget.name } })}
			</p>
			<p class="dialog-warn">
				<Icon icon="mdi:alert" width="16" height="16" />
				{$_('admin.organizations.deleteConfirmWarning')}
			</p>
			<label class="dialog-label" for="confirm-name-input">
				{$_('admin.organizations.deleteConfirmLabel')}
			</label>
			<p class="dialog-name-display">
				<code>{deleteTarget.name}</code>
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
			<input type="hidden" name="orgId" value={deleteTarget.id} />
			<div class="dialog-actions">
				<button type="button" class="ghost-btn" onclick={closeDelete}>
					{$_('admin.organizations.cancel')}
				</button>
				<button
					type="submit"
					class="danger-btn"
					disabled={confirmName.trim() !== deleteTarget.name.trim()}
				>
					{$_('admin.organizations.deleteConfirm')}
				</button>
			</div>
		</form>
	{/if}
</dialog>

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

	.actions {
		white-space: nowrap;
		display: flex;
		align-items: center;
		gap: 0.35rem;

		form { display: inline-flex; }
	}

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
		&.delete {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
			margin-left: 0.35rem;
			background: transparent;
			color: var(--pg-input-error);
			border: 1px solid rgba(182, 22, 22, 0.25);
		}
		&.delete:hover { background: rgba(182, 22, 22, 0.1); }
	}

	.banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: var(--pg-border-radius-md);
		padding: 0.6rem 0.85rem;
		margin-bottom: 1rem;
		font-size: var(--pg-font-size-sm);

		&.success { background: rgba(22, 163, 74, 0.08); border: 1px solid #16a34a; color: #16a34a; }
		&.error { background: rgba(182, 22, 22, 0.08); border: 1px solid var(--pg-input-error); color: var(--pg-input-error); }
	}

	.create-section { margin-bottom: 1.5rem; }

	.toggle-create {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: var(--pg-font-size-sm);
		padding: 6px 14px;
	}

	.create-form {
		margin-top: 0.75rem;
		background: var(--pg-soft-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.25rem;

		h2 { margin: 0 0 1rem; font-size: var(--pg-font-size-lg); }

		.grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
			gap: 0.85rem;
		}

		label {
			display: flex;
			flex-direction: column;
			gap: 0.3rem;
			font-size: var(--pg-font-size-sm);

			span:first-child {
				font-size: var(--pg-font-size-xs);
				color: var(--pg-text-secondary);
				text-transform: uppercase;
				font-weight: var(--pg-font-weight-medium);
				font-family: var(--pg-font-family);
			}
		}

		input.pg-input,
		select.pg-input { height: 2.25rem; font-size: var(--pg-font-size-sm); }

		.field-err { color: var(--pg-input-error); font-size: var(--pg-font-size-xs); }
	}

	.create-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
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
</style>
