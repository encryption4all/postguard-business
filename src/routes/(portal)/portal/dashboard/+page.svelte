<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO title="Dashboard" />

<h1>Dashboard</h1>

<div class="stats-grid">
	{#if data.featureFlags.apiKeys}
		<div class="stat-card">
			<div class="stat-icon">
				<Icon icon="mdi:key-variant" width="24" height="24" />
			</div>
			<div class="stat-info">
				<p class="stat-value">{data.stats.activeKeys}</p>
				<p class="stat-label">Active API keys</p>
			</div>
			<a href="/portal/api-keys" class="stat-link">Manage</a>
		</div>
	{/if}

	{#if data.featureFlags.emailLog}
		<div class="stat-card">
			<div class="stat-icon">
				<Icon icon="mdi:email-check" width="24" height="24" />
			</div>
			<div class="stat-info">
				<p class="stat-value">{data.stats.emailsThisMonth}</p>
				<p class="stat-label">Emails this month</p>
			</div>
			<a href="/portal/email-log" class="stat-link">View log</a>
		</div>
	{/if}

	{#if data.featureFlags.dns}
		<div class="stat-card">
			<div class="stat-icon" class:verified={data.stats.dnsVerified}>
				<Icon
					icon={data.stats.dnsVerified ? 'mdi:check-circle' : 'mdi:alert-circle'}
					width="24"
					height="24"
				/>
			</div>
			<div class="stat-info">
				<p class="stat-value">{data.stats.dnsVerified ? 'Verified' : 'Pending'}</p>
				<p class="stat-label">DNS status</p>
			</div>
			<a href="/portal/dns" class="stat-link">Configure</a>
		</div>
	{/if}
</div>

<section class="quick-actions">
	<h2>Quick actions</h2>
	<div class="actions-row">
		{#if data.featureFlags.apiKeys}
			<a href="/portal/api-keys/create" class="action-card">
				<Icon icon="mdi:key-plus" width="24" height="24" />
				<span>Create API key</span>
			</a>
		{/if}
		{#if data.featureFlags.orgInfo}
			<a href="/portal/organization" class="action-card">
				<Icon icon="mdi:office-building-cog" width="24" height="24" />
				<span>Edit organization</span>
			</a>
		{/if}
		{#if data.featureFlags.emailLog}
			<a href="/portal/email-log" class="action-card">
				<Icon icon="mdi:file-document-outline" width="24" height="24" />
				<span>Export audit log</span>
			</a>
		{/if}
	</div>
</section>

<style lang="scss">
	h1 {
		margin: 0 0 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;

		@media only screen and (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	.stat-card {
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.stat-icon {
		color: var(--pg-primary);

		&.verified {
			color: #16a34a;
		}
	}

	.stat-value {
		font-size: var(--pg-font-size-2xl);
		font-weight: var(--pg-font-weight-extrabold);
		margin: 0;
	}

	.stat-label {
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
		margin: 0;
	}

	.stat-link {
		font-size: var(--pg-font-size-sm);
		color: var(--pg-primary);
		font-weight: var(--pg-font-weight-medium);
		text-decoration: none;
		margin-top: auto;

		&:hover {
			text-decoration: underline;
		}
	}

	.quick-actions {
		h2 {
			margin-bottom: 1rem;
		}
	}

	.actions-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.action-card {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: var(--pg-general-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		text-decoration: none;
		color: var(--pg-text);
		font-size: var(--pg-font-size-md);
		font-weight: var(--pg-font-weight-medium);
		transition: border-color 0.2s, transform 0.2s;

		:global(svg) {
			color: var(--pg-primary);
		}

		&:hover {
			border-color: var(--pg-primary);
			transform: translateY(-1px);
		}
	}
</style>
