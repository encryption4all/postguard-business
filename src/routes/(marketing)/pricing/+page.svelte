<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';

	const plans = [
		{
			name: 'Starter',
			price: 'Free',
			period: '',
			description: 'For small teams getting started with email signing.',
			features: [
				'Up to 3 API keys',
				'100 signed emails/month',
				'Basic audit log',
				'Email support',
				'1 domain'
			],
			cta: 'Get started',
			href: '/register',
			highlighted: false
		},
		{
			name: 'Professional',
			price: '\u20AC49',
			period: '/month',
			description: 'For growing organizations with advanced needs.',
			features: [
				'Unlimited API keys',
				'10,000 signed emails/month',
				'Full audit log with export',
				'Priority support',
				'5 domains',
				'Read receipts',
				'Email revocation'
			],
			cta: 'Start free trial',
			href: '/register?plan=professional',
			highlighted: true
		},
		{
			name: 'Enterprise',
			price: 'Custom',
			period: '',
			description: 'For large organizations with custom requirements.',
			features: [
				'Everything in Professional',
				'Unlimited emails',
				'Unlimited domains',
				'Dedicated support',
				'SLA guarantees',
				'Custom integrations',
				'On-premise option'
			],
			cta: 'Contact sales',
			href: '/register?plan=enterprise',
			highlighted: false
		}
	];
</script>

<SEO title="Pricing" description="Choose the right PostGuard for Business plan for your organization." />

<section class="pricing-hero">
	<h1>Simple, transparent pricing</h1>
	<p>Choose the plan that fits your organization. All plans include DNS verification and Yivi-based authentication.</p>
</section>

<section class="pricing-grid">
	{#each plans as plan}
		<div class="plan-card" class:highlighted={plan.highlighted}>
			{#if plan.highlighted}
				<div class="plan-badge">Most popular</div>
			{/if}
			<h2>{plan.name}</h2>
			<div class="plan-price">
				<span class="price">{plan.price}</span>
				{#if plan.period}<span class="period">{plan.period}</span>{/if}
			</div>
			<p class="plan-description">{plan.description}</p>
			<a href={plan.href} class={plan.highlighted ? 'primary-btn' : 'secondary-btn'}>
				{plan.cta}
			</a>
			<ul class="plan-features">
				{#each plan.features as feature}
					<li>
						<Icon icon="mdi:check-circle" width="18" height="18" />
						<span>{feature}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
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
		padding: 2rem 1.5rem 4rem;

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

	.plan-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--pg-primary);
		color: #fff;
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		padding: 4px 12px;
		border-radius: 100px;
		white-space: nowrap;
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
	}

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 1.5rem 0 0;
		flex: 1;

		li {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.4rem 0;
			font-size: var(--pg-font-size-md);
			color: var(--pg-text);

			:global(svg) {
				color: var(--pg-primary);
				flex-shrink: 0;
			}
		}
	}
</style>
