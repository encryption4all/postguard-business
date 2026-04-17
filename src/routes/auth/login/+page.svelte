<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import YiviLogin from '$lib/components/YiviLogin.svelte';
	import Icon from '@iconify/svelte';
	import logoLight from '$lib/assets/images/logo.svg';
	import logoDark from '$lib/assets/images/logo-dark.svg';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const redirectTo = $derived(page.url.searchParams.get('redirect') ?? '/portal/dashboard');

	function handleSuccess() {
		goto(redirectTo);
	}
</script>

<SEO title="Login" description="Log in to your PostGuard for Business account." />

<section class="login-page">
	<div class="login-header">
		<a href="/" class="logo">
			<img src={logoLight} alt="PostGuard" class="logo-img light-only" height="22" /><img src={logoDark} alt="PostGuard" class="logo-img dark-only" height="22" />
			<span class="logo-badge">Business</span>
		</a>
		<ThemeSwitcher />
	</div>
	<div class="login-card">
		<h1>Log in</h1>
		<p class="login-subtitle">
			Authenticate with your Yivi app to access your organization portal.
		</p>

		<div class="login-content">
			<p class="login-hint">Disclose your organization email address to log in.</p>
			<YiviLogin type="org" attrs={data.yiviAttrs} onSuccess={handleSuccess} />
		</div>

		<p class="login-footer">
			Don't have an account? <a href="/register">Register your organization</a>
		</p>
	</div>
</section>

<style lang="scss">
	.login-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		padding: 0 1.5rem 3rem;
		background: var(--pg-general-background);
	}

	.login-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 440px;
		padding: 1.5rem 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
	}

	.logo-badge {
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		background: var(--pg-primary);
		color: #fff;
		padding: 2px 6px;
		border-radius: var(--pg-border-radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.login-card {
		width: 100%;
		max-width: 440px;
		background: var(--pg-soft-background);
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 2.5rem 2rem;
		text-align: center;

		h1 {
			margin-bottom: 0.5rem;
		}
	}

	.login-subtitle {
		color: var(--pg-text-secondary);
		margin-bottom: 1.5rem;
	}

	.login-content {
		padding: 1rem 0;
	}

	.login-hint {
		color: var(--pg-text-secondary);
		font-size: var(--pg-font-size-sm);
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.login-footer {
		margin-top: 1.5rem;
		font-size: var(--pg-font-size-sm);
		color: var(--pg-text-secondary);

		a {
			color: var(--pg-primary);
			font-weight: var(--pg-font-weight-medium);
		}
	}
</style>
