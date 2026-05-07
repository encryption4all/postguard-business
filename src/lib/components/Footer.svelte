<script module lang="ts">
	declare const __COMMIT_HASH__: string;
</script>

<script lang="ts">
	import { _ } from 'svelte-i18n';
	import pkg from '../../../package.json';

	const year = new Date().getFullYear();
	const hash = __COMMIT_HASH__;
	const versionLabel = hash ? `${pkg.version}+${hash}` : pkg.version;
</script>

<footer>
	<div class="footer-inner">
		<div class="footer-brand">
			<p class="brand-name">{$_('footer.brandName')}</p>
			<p class="brand-tagline">{$_('footer.tagline')}</p>
		</div>

		<div class="footer-links">
			<nav class="link-group" aria-labelledby="footer-product-title">
				<h2 id="footer-product-title" class="group-title">{$_('footer.product')}</h2>
				<a href="/pricing">{$_('nav.pricing')}</a>
				<a href="/register">{$_('nav.register')}</a>
			</nav>
			<nav class="link-group" aria-labelledby="footer-resources-title">
				<h2 id="footer-resources-title" class="group-title">{$_('footer.resources')}</h2>
				<a href="https://postguard.eu" target="_blank" rel="noopener noreferrer">
					{$_('footer.personal')}
					<span class="visually-hidden"> ({$_('common.opensInNewWindow', { default: 'opens in new window' })})</span>
				</a>
				<a href="https://docs.postguard.eu" target="_blank" rel="noopener noreferrer">
					{$_('footer.docs')}
					<span class="visually-hidden"> ({$_('common.opensInNewWindow', { default: 'opens in new window' })})</span>
				</a>
			</nav>
		</div>

		<div class="footer-bottom">
			<p>{$_('footer.copyright', { values: { year } })}</p>
			<span class="version">v{versionLabel}</span>
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

		.group-title {
			display: block;
			font-size: var(--pg-font-size-sm);
			font-weight: var(--pg-font-weight-bold);
			color: var(--pg-text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.5px;
			line-height: normal;
			margin: 0 0 0.25rem;
			font-family: inherit;
		}

		.visually-hidden {
			position: absolute;
			width: 1px;
			height: 1px;
			padding: 0;
			margin: -1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			border: 0;
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
