<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let copied = $state(false);

	async function copyKey() {
		if (form?.rawKey) {
			await navigator.clipboard.writeText(form.rawKey);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<SEO title="Create API Key" />

{#if form?.success && form?.rawKey}
	<div class="key-created">
		<div class="key-created-icon">
			<Icon icon="mdi:key-chain" width="48" height="48" />
		</div>
		<h1>API key created</h1>
		<p class="warning">
			<Icon icon="mdi:alert" width="18" height="18" />
			Copy this key now. You won't be able to see it again.
		</p>
		<div class="key-display">
			<code>{form.rawKey}</code>
			<button class="ghost-btn copy-btn" onclick={copyKey}>
				<Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width="18" height="18" />
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>
		<a href="/portal/api-keys" class="secondary-btn back-btn">Back to API keys</a>
	</div>
{:else}
	<div class="page-header">
		<a href="/portal/api-keys" class="back-link">
			<Icon icon="mdi:arrow-left" width="18" height="18" />
			Back
		</a>
		<h1>Create API key</h1>
	</div>

	{#if form?.error}
		<div class="form-error" role="alert">
			<Icon icon="mdi:alert-circle" width="20" height="20" />
			<span>{form.error}</span>
		</div>
	{/if}

	<form method="POST" use:enhance class="create-form">
		<div class="form-group">
			<label for="name">Key name</label>
			<input
				id="name"
				name="name"
				type="text"
				class="pg-input"
				placeholder="e.g. Production Mailer"
				value={form?.values?.name ?? ''}
				required
			/>
			<span class="field-hint">A descriptive name to identify this key</span>
		</div>

		<div class="form-group">
			<label for="expiryDays">Expires in</label>
			<select id="expiryDays" name="expiryDays" class="pg-input">
				<option value="30">30 days</option>
				<option value="90">90 days</option>
				<option value="180">180 days</option>
				<option value="365" selected>1 year</option>
			</select>
		</div>

		<fieldset class="signing-attrs">
			<legend>Signing attributes</legend>
			<p class="field-hint">Choose which organizational attributes this API key will include when signing emails.</p>

			<label class="checkbox-label">
				<input type="checkbox" name="signEmail" checked />
				<span>Email address</span>
			</label>

			<label class="checkbox-label">
				<input type="checkbox" name="signOrgName" checked />
				<span>Organization name</span>
			</label>

			<label class="checkbox-label">
				<input type="checkbox" name="signPhone" />
				<span>Phone number</span>
			</label>

			<label class="checkbox-label">
				<input type="checkbox" name="signKvkNumber" />
				<span>KVK number</span>
			</label>
		</fieldset>

		<button type="submit" class="primary-btn">Generate API key</button>
	</form>
{/if}

<style lang="scss">
	.page-header {
		margin-bottom: 1.5rem;

		h1 {
			margin: 0.5rem 0 0;
		}
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
		text-decoration: none;

		&:hover {
			color: var(--pg-primary);
		}
	}

	.create-form {
		max-width: 500px;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;

		label {
			font-size: var(--pg-font-size-sm);
			font-weight: var(--pg-font-weight-medium);
		}
	}

	.field-hint {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
	}

	.form-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(182, 22, 22, 0.08);
		border: 1px solid var(--pg-input-error);
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		color: var(--pg-input-error);
		font-size: var(--pg-font-size-sm);
	}

	.signing-attrs {
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		padding: 1rem;

		legend {
			font-weight: var(--pg-font-weight-bold);
			font-size: var(--pg-font-size-md);
			padding: 0 0.5rem;
			color: var(--pg-text);
			font-family: var(--pg-font-family);
		}
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0;
		cursor: pointer;
		font-size: var(--pg-font-size-md);

		input[type='checkbox'] {
			width: 18px;
			height: 18px;
			accent-color: var(--pg-primary);
		}
	}

	/* Key created state */
	.key-created {
		text-align: center;
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem 0;
	}

	.key-created-icon {
		color: var(--pg-primary);
		margin-bottom: 1rem;
	}

	.warning {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #b45309;
		font-weight: var(--pg-font-weight-medium);
		font-size: var(--pg-font-size-md);
		margin-bottom: 1.5rem;
	}

	.key-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--pg-soft-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		padding: 1rem;
		margin-bottom: 2rem;

		code {
			flex: 1;
			font-family: monospace;
			font-size: var(--pg-font-size-sm);
			word-break: break-all;
			text-align: left;
		}
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 6px 12px;
		border-radius: var(--pg-border-radius-sm);
		font-size: var(--pg-font-size-sm);
		color: var(--pg-primary);
		white-space: nowrap;

		&:hover {
			background: var(--pg-strong-background);
		}
	}

	.ghost-btn {
		font-family: var(--pg-font-family);
	}

	.back-btn {
		margin-top: 1rem;
	}
</style>
