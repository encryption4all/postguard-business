<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
	import { _ } from 'svelte-i18n';
</script>

<SEO title={$_('pricing.title')} description={$_('pricing.seoDescription')} />

<section class="pricing-hero">
	<h1>{$_('pricing.heading')}</h1>
	<p>{$_('pricing.subtitle')}</p>
</section>

<section class="pricing-grid">
	<div class="plan-card">
		<h2>{$_('pricing.small.name')}</h2>
		<div class="plan-users">{$_('pricing.small.users')}</div>
		<div class="plan-price">
			<span class="price">{$_('pricing.small.price')}</span>
			<span class="period">{$_('pricing.small.period')}</span>
		</div>
		<p class="plan-description">{$_('pricing.small.description')}</p>
		<a href="/register?plan=small" class="secondary-btn">{$_('pricing.small.cta')}</a>
	</div>

	<div class="plan-card highlighted">
		<h2>{$_('pricing.medium.name')}</h2>
		<div class="plan-users">{$_('pricing.medium.users')}</div>
		<div class="plan-price">
			<span class="price">{$_('pricing.medium.price')}</span>
			<span class="period">{$_('pricing.medium.period')}</span>
		</div>
		<p class="plan-description">{$_('pricing.medium.description')}</p>
		<a href="/register?plan=medium" class="primary-btn">{$_('pricing.medium.cta')}</a>
	</div>

	<div class="plan-card">
		<h2>{$_('pricing.enterprise.name')}</h2>
		<div class="plan-users">{$_('pricing.enterprise.users')}</div>
		<div class="plan-price">
			<span class="price">{$_('pricing.enterprise.price')}</span>
		</div>
		<p class="plan-description">{$_('pricing.enterprise.description')}</p>
		<a href="/register?plan=enterprise" class="secondary-btn">{$_('pricing.enterprise.cta')}</a>
	</div>
</section>

<section class="advantages">
	<h2>{$_('pricing.advantages.title')}</h2>
	<ul class="advantages-list">
		<li>
			<Icon icon="mdi:check-circle" width="20" height="20" />
			<span>{$_('pricing.advantages.allIn')}</span>
		</li>
		<li>
			<Icon icon="mdi:check-circle" width="20" height="20" />
			<span>{$_('pricing.advantages.noFees')}</span>
		</li>
		<li>
			<Icon icon="mdi:check-circle" width="20" height="20" />
			<span>{$_('pricing.advantages.onboarding')}</span>
		</li>
		<li>
			<Icon icon="mdi:check-circle" width="20" height="20" />
			<span>{$_('pricing.advantages.contracts')}</span>
		</li>
	</ul>
</section>

<style lang="scss">
	.pricing-hero {
		text-align: center;
		padding: 4rem 1.5rem 2rem;
		background: linear-gradient(180deg, var(--pg-soft-background) 0%, var(--pg-general-background) 100%);

		h1 {
			font-size: 2.2rem;
			margin-bottom: 0.75rem;
		}

		p {
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-lg);
			max-width: 600px;
			margin: 0 auto;
		}
	}

	.pricing-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem 1.5rem 2rem;

		@media only screen and (max-width: 900px) {
			grid-template-columns: 1fr;
			max-width: 450px;
		}
	}

	.plan-card {
		position: relative;
		background: var(--pg-general-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 2rem 1.5rem;
		display: flex;
		flex-direction: column;
		transition: transform 0.2s ease;

		&:hover {
			transform: translateY(-2px);
		}

		&.highlighted {
			border-color: var(--pg-primary);
			box-shadow: 0 4px 20px rgba(124, 58, 237, 0.15);
		}

		h2 {
			font-size: var(--pg-font-size-xl);
			margin: 0 0 0.5rem;
		}
	}

	.plan-users {
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);
		margin-bottom: 0.5rem;
	}

	.plan-price {
		margin-bottom: 0.75rem;

		.price {
			font-family: var(--pg-font-family);
			font-size: 2rem;
			font-weight: var(--pg-font-weight-extrabold);
			color: var(--pg-text);
		}

		.period {
			font-size: var(--pg-font-size-md);
			color: var(--pg-text-secondary);
		}
	}

	.plan-description {
		color: var(--pg-text-secondary);
		font-size: var(--pg-font-size-md);
		margin-bottom: 1.5rem;
		line-height: 1.5;
		flex: 1;
	}

	.advantages {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem 1.5rem 4rem;
		text-align: center;

		h2 {
			margin-bottom: 1.25rem;
		}
	}

	.advantages-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		li {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 0.5rem;
			font-size: var(--pg-font-size-md);
			color: var(--pg-text);

			:global(svg) {
				color: var(--pg-primary);
				flex-shrink: 0;
			}
		}
	}
</style>
