<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let copied = $state(false);

	async function copyRecord() {
		await navigator.clipboard.writeText(data.dns.txtRecord);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<SEO title={$_('dns.title')} />

<h1>{$_('dns.title')}</h1>

<div class="status-card" class:verified={data.dns.verified}>
	<div class="status-header">
		<Icon
			icon={data.dns.verified ? 'mdi:check-circle' : 'mdi:alert-circle'}
			width="28"
			height="28"
		/>
		<div>
			<h2>{data.dns.verified ? $_('dns.domainVerified') : $_('dns.verificationPending')}</h2>
			<p class="domain">{data.dns.domain}</p>
		</div>
	</div>
	{#if data.dns.verifiedAt}
		<p class="verified-date">{$_('dns.verifiedOn', { values: { date: new Date(data.dns.verifiedAt).toLocaleDateString() } })}</p>
	{/if}
</div>

{#if form?.error}
	<div class="verify-error" role="alert">
		<Icon icon="mdi:alert" width="18" height="18" />
		<span>{form.error}</span>
	</div>
{/if}

{#if form?.verified}
	<div class="verify-success" role="status">
		<Icon icon="mdi:check-circle" width="18" height="18" />
		<span>{$_('dns.verifiedSuccess')}</span>
	</div>
{/if}

<section class="instructions">
	<h2>{$_('dns.instructions')}</h2>

	<div class="step">
		<div class="step-number">1</div>
		<div class="step-content">
			<h3>{$_('dns.step1Title')}</h3>
			<p>{$_('dns.step1Desc')}</p>
			<div class="record-box">
				<div class="record-field">
					<span class="record-label">{$_('dns.type')}</span>
					<code>TXT</code>
				</div>
				<div class="record-field">
					<span class="record-label">{$_('dns.nameHost')}</span>
					<code>@</code>
				</div>
				<div class="record-field">
					<span class="record-label">{$_('dns.value')}</span>
					<div class="record-value-row">
						<code>{data.dns.txtRecord}</code>
						<button class="ghost-btn copy-btn" onclick={copyRecord}>
							<Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} width="16" height="16" />
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="step">
		<div class="step-number">2</div>
		<div class="step-content">
			<h3>{$_('dns.step2Title')}</h3>
			<p>{$_('dns.step2Desc')}</p>
		</div>
	</div>

	<div class="step">
		<div class="step-number">3</div>
		<div class="step-content">
			<h3>{$_('dns.step3Title')}</h3>
			<p>{$_('dns.step3Desc')}</p>
			<form method="POST" action="?/verify" use:enhance>
				<button type="submit" class="primary-btn">
					<Icon icon="mdi:check-network" width="18" height="18" />
					{$_('dns.verifyBtn')}
				</button>
			</form>
			{#if data.dns.lastCheckedAt}
				<p class="last-check">{$_('dns.lastChecked', { values: { date: new Date(data.dns.lastCheckedAt).toLocaleString() } })}</p>
			{/if}
		</div>
	</div>
</section>

<style lang="scss">
	h1 { margin: 0 0 1.5rem; }

	.status-card {
		background: var(--pg-soft-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.25rem;
		margin-bottom: 1.5rem;

		&.verified {
			border-color: #16a34a;
			:global(svg) { color: #16a34a; }
		}

		:global(svg) { color: #b45309; }
	}

	.status-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;

		h2 { margin: 0; font-size: var(--pg-font-size-lg); }
		.domain { color: var(--pg-text-secondary); font-size: var(--pg-font-size-sm); margin: 0; }
	}

	.verified-date {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		margin: 0.5rem 0 0;
	}

	.verify-error, .verify-success {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		font-size: var(--pg-font-size-sm);
	}

	.verify-error {
		background: rgba(182, 22, 22, 0.08);
		border: 1px solid var(--pg-input-error);
		color: var(--pg-input-error);
	}

	.verify-success {
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid #16a34a;
		color: #16a34a;
	}

	.instructions { max-width: 650px; }
	.instructions h2 { margin-bottom: 1.5rem; }

	.step {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.step-number {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--pg-primary-bg);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--pg-font-weight-bold);
		font-size: var(--pg-font-size-sm);
		flex-shrink: 0;
		font-family: var(--pg-font-family);
	}

	.step-content {
		flex: 1;

		h3 { margin: 0.25rem 0 0.5rem; }
		p { color: var(--pg-text-secondary); line-height: 1.5; }
	}

	.record-box {
		background: var(--pg-soft-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		padding: 1rem;
		margin-top: 0.75rem;
	}

	.record-field {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.35rem 0;

		&:not(:last-child) { border-bottom: 1px solid var(--pg-strong-background); }
	}

	.record-label {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		font-weight: var(--pg-font-weight-medium);
		min-width: 80px;
		font-family: var(--pg-font-family);
	}

	code {
		font-family: monospace;
		font-size: var(--pg-font-size-sm);
		word-break: break-all;
	}

	.record-value-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.copy-btn {
		color: var(--pg-primary);
		padding: 4px;
		border-radius: var(--pg-border-radius-sm);
		&:hover { background: var(--pg-strong-background); }
	}

	.ghost-btn { font-family: var(--pg-font-family); }

	.last-check {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		margin-top: 0.5rem;
	}
</style>
