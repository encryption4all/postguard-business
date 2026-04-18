<script lang="ts">
	import { version } from '$app/environment';

	const year = new Date().getFullYear();
</script>

<footer>
	<div class="footer-inner">
		<div class="footer-brand">
			<p class="brand-name">PostGuard for Business</p>
			<p class="brand-tagline">Enterprise-grade identity-based email signing</p>
		</div>

		<div class="footer-links">
			<div class="link-group">
				<h4>Product</h4>
				<a href="/pricing">Pricing</a>
				<a href="/register">Register</a>
			</div>
			<div class="link-group">
				<h4>Resources</h4>
				<a href="https://postguard.eu" target="_blank" rel="noopener">PostGuard Personal</a>
				<a href="https://docs.postguard.eu" target="_blank" rel="noopener">Documentation</a>
			</div>
		</div>

		<div class="footer-bottom">
			<p>&copy; {year} PostGuard. All rights reserved.</p>
			<span class="version">v{version}</span>
		</div>
	</div>
</footer>

<style lang="scss">
	footer {
		background: var(--pg-soft-background);
		border-top: 1px solid var(--pg-strong-background);
		margin-top: auto;
	}

	.footer-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 1.5rem;
	}

	.footer-brand {
		margin-bottom: 1.5rem;

		.brand-name {
			font-weight: var(--pg-font-weight-extrabold);
			font-size: var(--pg-font-size-lg);
			margin: 0;
		}

		.brand-tagline {
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-sm);
			margin: 0.25rem 0 0;
		}
	}

	.footer-links {
		display: flex;
		gap: 3rem;
		margin-bottom: 2rem;

		@media only screen and (max-width: 768px) {
			flex-direction: column;
			gap: 1.5rem;
		}
	}

	.link-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		h4 {
			font-size: var(--pg-font-size-sm);
			font-weight: var(--pg-font-weight-bold);
			color: var(--pg-text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			margin: 0 0 0.25rem;
		}

		a {
			font-size: var(--pg-font-size-md);
			color: var(--pg-text);
			text-decoration: none;

			&:hover {
				color: var(--pg-primary);
			}
		}
	}

	.footer-bottom {
		border-top: 1px solid var(--pg-strong-background);
		padding-top: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;

		p {
			font-size: var(--pg-font-size-xs);
			color: var(--pg-text-secondary);
			margin: 0;
		}

		.version {
			font-size: var(--pg-font-size-xs);
			color: var(--pg-text-secondary);
			opacity: 0.6;
		}
	}
</style>
