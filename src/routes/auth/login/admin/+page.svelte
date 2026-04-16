<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import YiviLogin from '$lib/components/YiviLogin.svelte';
	import Icon from '@iconify/svelte';
	import logoLight from '$lib/assets/images/logo.svg';
	import logoDark from '$lib/assets/images/logo-dark.svg';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto('/admin/organizations');
	}
</script>

<SEO title="Admin Login" />

<section class="login-page">
	<div class="login-header">
		<a href="/" class="logo">
			<img src={logoLight} alt="PostGuard" class="logo-img light-only" height="22" /><img src={logoDark} alt="PostGuard" class="logo-img dark-only" height="22" />
			<span>PostGuard</span>
		</a>
		<ThemeSwitcher />
	</div>
	<div class="login-card">
		<h1>Admin Login</h1>
		<p class="login-subtitle">
			Disclose your full name, email address, and phone number to log in as an administrator.
		</p>

		<div class="login-content">
			<YiviLogin type="admin" attrs={data.yiviAttrs} onSuccess={handleSuccess} />
		</div>
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
		color: var(--pg-text);
		font-family: var(--pg-font-family);
		font-weight: var(--pg-font-weight-extrabold);
		font-size: var(--pg-font-size-lg);
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
		line-height: 1.5;
	}

	.login-content {
		padding: 1rem 0;
	}
</style>
