<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Icon from '@iconify/svelte';
</script>

<SEO
	title="Enterprise Email Signing & Encryption"
	description="PostGuard for Business offers enterprise-grade identity-based email signing and encryption. Manage API keys, verify domains, and audit email activity."
/>

<section class="hero">
	<div class="hero-content">
		<h1>Secure email signing for your organization</h1>
		<p class="hero-subtitle">
			PostGuard for Business lets your organization sign and encrypt emails with
			identity-verified attributes. Manage API keys, verify your domain, and maintain full
			audit trails.
		</p>
		<div class="hero-actions">
			<a href="/register" class="primary-btn">Get started</a>
			<a href="/pricing" class="secondary-btn">View pricing</a>
		</div>
	</div>
</section>

<section class="features">
	<h2 class="section-title">Why PostGuard for Business?</h2>
	<div class="features-grid">
		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:key-variant" width="32" height="32" />
			</div>
			<h3>API Key Management</h3>
			<p>
				Create and manage API keys with granular control over which organizational attributes
				each key signs with.
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:dns" width="32" height="32" />
			</div>
			<h3>DNS Verification</h3>
			<p>
				Verify your domain ownership and configure DNS records so PostGuard can sign emails on
				your behalf.
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:clipboard-text-clock" width="32" height="32" />
			</div>
			<h3>Email Audit Log</h3>
			<p>
				Full audit trail of every signed email. Revoke emails, track read receipts, and export
				compliance reports.
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:shield-account" width="32" height="32" />
			</div>
			<h3>Identity-Based Signing</h3>
			<p>
				Sign emails with your organization name, KVK number, phone, and email — verified
				through Yivi.
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:lock-check" width="32" height="32" />
			</div>
			<h3>End-to-End Encryption</h3>
			<p>
				Emails are encrypted end-to-end. Only the intended recipient with the right identity
				attributes can decrypt.
			</p>
		</div>

		<div class="feature-card">
			<div class="feature-icon">
				<Icon icon="mdi:source-branch" width="32" height="32" />
			</div>
			<h3>Open Source</h3>
			<p>
				Built on the open-source PostGuard protocol. Full transparency, no vendor lock-in,
				community-driven.
			</p>
		</div>
	</div>
</section>

<section class="cta">
	<div class="cta-content">
		<h2>Ready to secure your organization's email?</h2>
		<p>Register for PostGuard for Business and start signing emails in minutes.</p>
		<a href="/register" class="primary-btn">Register your organization</a>
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
