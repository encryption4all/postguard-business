<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO
	title={$_('seo.homeTitle')}
	description={$_('seo.homeDescription')}
/>

<section class="hero">
	<div class="hero-content">
		<h1>{$_('hero.title')}</h1>
		<p class="hero-subtitle">
			{$_('hero.subtitle')}
		</p>
		<div class="hero-actions">
			<a href="/register" class="primary-btn">{$_('hero.cta')}</a>
			{#if data.marketingFlags.pricing}
				<a href="/pricing" class="secondary-btn">{$_('hero.pricing')}</a>
			{/if}
		</div>
	</div>
</section>

<section class="features">
	<h2 class="section-title">{$_('features.title')}</h2>
	<div class="features-grid">
		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:key-variant" width="32" height="32" />
			</div>
			<h3>{$_('features.apiKeys.title')}</h3>
			<p>
				{$_('features.apiKeys.description')}
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:shield-account" width="32" height="32" />
			</div>
			<h3>{$_('features.identity.title')}</h3>
			<p>
				{$_('features.identity.description')}
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:server-security" width="32" height="32" />
			</div>
			<h3>{$_('features.hostedEU.title')}</h3>
			<p>
				{$_('features.hostedEU.description')}
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:lock-check" width="32" height="32" />
			</div>
			<h3>{$_('features.encryption.title')}</h3>
			<p>
				{$_('features.encryption.description')}
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:source-branch" width="32" height="32" />
			</div>
			<h3>{$_('features.openSource.title')}</h3>
			<p>
				{$_('features.openSource.description')}
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:email-remove" width="32" height="32" />
			</div>
			<h3>{$_('features.revocation.title')} <span class="coming-soon">{$_('features.revocation.comingSoon')}</span></h3>
			<p>
				{$_('features.revocation.description')}
			</p>
		</div>
	</div>
</section>

<section class="cta">
	<div class="cta-content">
		<h2>{$_('cta.title')}</h2>
		<p>{$_('cta.subtitle')}</p>
		<a href="/register" class="primary-btn">{$_('cta.button')}</a>
	</div>
</section>

<style lang="scss">
	.hero {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		background: linear-gradient(
			180deg,
			var(--pg-soft-background) 0%,
			var(--pg-general-background) 100%
		);
	}

	.hero-content {
		max-width: 700px;
		text-align: center;

		h1 {
			font-size: 2.5rem;
			line-height: 1.2;
			margin-bottom: 1rem;

			@media only screen and (max-width: 768px) {
				font-size: 1.8rem;
			}
		}
	}

	.hero-subtitle {
		font-size: var(--pg-font-size-lg);
		color: var(--pg-text-secondary);
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.features {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	.section-title {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;

		@media only screen and (max-width: 900px) {
			grid-template-columns: repeat(2, 1fr);
		}

		@media only screen and (max-width: 600px) {
			grid-template-columns: 1fr;
		}
	}

	.feature-card {
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.5rem;
		transition: transform 0.2s ease;

		&:hover {
			transform: translateY(-2px);
		}

		h3 {
			margin: 0.75rem 0 0.5rem;
		}

		p {
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-md);
			line-height: 1.5;
		}
	}

	.coming-soon {
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		background: var(--pg-strong-background);
		color: var(--pg-text-secondary);
		padding: 2px 8px;
		border-radius: 100px;
		vertical-align: middle;
		margin-left: 0.25rem;
	}

	.feature-icon {
		color: var(--pg-primary);
	}

	.cta {
		background: var(--pg-soft-background);
		padding: 4rem 1.5rem;
		text-align: center;
	}

	.cta-content {
		max-width: 600px;
		margin: 0 auto;

		h2 {
			margin-bottom: 0.75rem;
		}

		p {
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-lg);
			margin-bottom: 1.5rem;
		}
	}
</style>
