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
	<div class="hero-inner">
		<div class="hero-text">
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
		<div class="hero-visual">
			<div class="visual-stack">
				<div class="visual-card">
					<Icon icon="mdi:lock-check" width="22" height="22" />
					<span>{$_('features.encryption.title')}</span>
				</div>
				<div class="visual-card">
					<Icon icon="mdi:shield-account" width="22" height="22" />
					<span>{$_('features.identity.title')}</span>
				</div>
				<div class="visual-card accent">
					<Icon icon="mdi:key-variant" width="22" height="22" />
					<span>{$_('features.apiKeys.title')}</span>
				</div>
			</div>
		</div>
	</div>
</section>

<section class="features">
	<h2 class="section-title">{$_('features.title')}</h2>

	<div class="feature-list">
		<div class="feature-block">
			<div class="bg-icon"><Icon icon="mdi:key-variant" width="120" height="120" /></div>
			<h3>{$_('features.apiKeys.title')}</h3>
			<p>{$_('features.apiKeys.description')}</p>
		</div>

		<div class="feature-block">
			<div class="bg-icon"><Icon icon="mdi:shield-account" width="120" height="120" /></div>
			<h3>{$_('features.identity.title')}</h3>
			<p>{$_('features.identity.description')}</p>
		</div>

		<div class="feature-block">
			<div class="bg-icon"><Icon icon="mdi:lock-check" width="120" height="120" /></div>
			<h3>{$_('features.encryption.title')}</h3>
			<p>{$_('features.encryption.description')}</p>
		</div>

		<div class="feature-block">
			<div class="bg-icon"><Icon icon="mdi:server-security" width="120" height="120" /></div>
			<h3>{$_('features.hostedEU.title')}</h3>
			<p>{$_('features.hostedEU.description')}</p>
		</div>

		<div class="feature-block">
			<div class="bg-icon"><Icon icon="mdi:source-branch" width="120" height="120" /></div>
			<h3>{$_('features.openSource.title')}</h3>
			<p>{$_('features.openSource.description')}</p>
		</div>

		<div class="feature-block muted">
			<div class="bg-icon"><Icon icon="mdi:email-remove" width="120" height="120" /></div>
			<h3>{$_('features.revocation.title')} <span class="coming-soon">{$_('features.revocation.comingSoon')}</span></h3>
			<p>{$_('features.revocation.description')}</p>
		</div>
	</div>
</section>

<section class="cta">
	<div class="cta-inner">
		<h2>{$_('cta.title')}</h2>
		<p>{$_('cta.subtitle')}</p>
		<a href="/register" class="primary-btn">{$_('cta.button')}</a>
	</div>
</section>

<style lang="scss">
	/* ── Hero ── */
	.hero {
		padding: 4rem 1.5rem;
		background: var(--pg-soft-background);
	}

	.hero-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: 3rem;
		align-items: center;

		@media only screen and (max-width: 800px) {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
	}

	.hero-text {
		h1 {
			font-size: 2.6rem;
			line-height: 1.15;
			margin-bottom: 1rem;

			@media only screen and (max-width: 768px) {
				font-size: 1.9rem;
			}
		}
	}

	.hero-subtitle {
		font-size: var(--pg-font-size-lg);
		color: var(--pg-text-secondary);
		line-height: 1.6;
		margin-bottom: 1.5rem;
		max-width: 520px;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hero-visual {
		display: flex;
		justify-content: center;

		@media only screen and (max-width: 800px) {
			display: none;
		}
	}

	.visual-stack {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 280px;
	}

	.visual-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: var(--pg-general-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		padding: 0.85rem 1rem;
		font-size: var(--pg-font-size-md);
		font-weight: var(--pg-font-weight-medium);
		font-family: var(--pg-font-family);

		:global(svg) {
			color: var(--pg-primary);
			flex-shrink: 0;
		}

		&.accent {
			background: var(--pg-primary);
			border-color: var(--pg-primary);
			color: #fff;

			:global(svg) {
				color: #fff;
			}

			span {
				color: #fff;
			}
		}
	}

	/* ── Features ── */
	.features {
		max-width: 1100px;
		margin: 0 auto;
		padding: 3rem 1.5rem 4rem;
	}

	.section-title {
		margin-bottom: 2rem;
	}

	.feature-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;

		@media only screen and (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	.feature-block {
		position: relative;
		overflow: hidden;
		border-radius: var(--pg-border-radius-lg);
		padding: 2rem 1.75rem;
		min-height: 160px;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background: var(--pg-soft-background);

		&.muted {
			opacity: 0.6;
		}

		h3 {
			position: relative;
			margin: 0 0 0.35rem;
		}

		p {
			position: relative;
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-md);
			line-height: 1.5;
		}
	}

	.bg-icon {
		position: absolute;
		top: -10px;
		right: -10px;
		opacity: 0.08;
		pointer-events: none;

		:global(svg) {
			color: var(--pg-primary);
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

	/* ── CTA ── */
	.cta {
		border-top: 1px solid var(--pg-strong-background);
		padding: 4rem 1.5rem;
	}

	.cta-inner {
		max-width: 1100px;
		margin: 0 auto;

		h2 {
			margin-bottom: 0.5rem;
		}

		p {
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-lg);
			margin-bottom: 1.5rem;
			max-width: 500px;
		}
	}
</style>
