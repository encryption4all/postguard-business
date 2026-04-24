<script lang="ts">
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import Icon from '@iconify/svelte';
	import logoLight from '$lib/assets/images/logo.svg';
	import logoDark from '$lib/assets/images/logo-dark.svg';

	type AuthProp =
		| { loggedIn: true; email: string | null; portalHref: string }
		| { loggedIn: false; email: null; portalHref: string };

	let {
		showPricing = true,
		showRegister = true,
		auth = { loggedIn: false, email: null, portalHref: '/portal/dashboard' }
	}: {
		showPricing?: boolean;
		showRegister?: boolean;
		auth?: AuthProp;
	} = $props();

	let menuOpen = $state(false);

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	const navLinks = $derived([
		{ href: '/', label: 'Home' },
		...(showPricing ? [{ href: '/pricing', label: 'Pricing' }] : []),
		...(showRegister ? [{ href: '/register', label: 'Register' }] : [])
	]);
</script>

<header>
	<div class="header-inner">
		<a href="/" class="logo" aria-label="PostGuard for Business home">
			<img src={logoLight} alt="PostGuard" class="logo-img light-only" height="28" />
			<img src={logoDark} alt="PostGuard" class="logo-img dark-only" height="28" />
			<span class="logo-badge">Business</span>
		</a>

		<nav class="desktop-nav" aria-label="Main navigation">
			{#each navLinks as link}
				<a href={link.href}>{link.label}</a>
			{/each}
			{#if auth.loggedIn}
				{#if auth.email}
					<span class="nav-user" aria-label="Signed in as {auth.email}">{auth.email}</span>
				{/if}
				<a href={auth.portalHref} class="nav-login">My portal</a>
			{:else}
				<a href="/auth/login" class="nav-login">Log in</a>
			{/if}
		</nav>

		<div class="header-actions">
			<ThemeSwitcher />
			<button
				class="hamburger desktop-hide"
				aria-label="Toggle menu"
				aria-expanded={menuOpen}
				onclick={toggleMenu}
			>
				<Icon icon={menuOpen ? 'mdi:close' : 'mdi:menu'} width="24" height="24" />
			</button>
		</div>
	</div>

	{#if menuOpen}
		<nav class="mobile-nav" aria-label="Mobile navigation">
			{#each navLinks as link}
				<a href={link.href} onclick={() => (menuOpen = false)}>{link.label}</a>
			{/each}
			{#if auth.loggedIn}
				{#if auth.email}
					<span class="mobile-user">{auth.email}</span>
				{/if}
				<a href={auth.portalHref} onclick={() => (menuOpen = false)}>My portal</a>
			{:else}
				<a href="/auth/login" onclick={() => (menuOpen = false)}>Log in</a>
			{/if}
		</nav>
	{/if}
</header>

<style lang="scss">
	header {
		position: sticky;
		top: 0;
		z-index: 100;
		background: var(--pg-general-background);
		border-bottom: 1px solid var(--pg-strong-background);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.75rem 1.5rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--pg-text);
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

	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 1.5rem;

		a {
			font-family: var(--pg-font-family);
			font-size: var(--pg-font-size-md);
			font-weight: var(--pg-font-weight-medium);
			text-decoration: none;
			color: var(--pg-text-secondary);
			transition: color 0.2s ease;

			&:hover {
				color: var(--pg-primary);
			}
		}

		.nav-login {
			color: var(--pg-primary);
			font-weight: var(--pg-font-weight-bold);
		}

		.nav-user {
			font-family: var(--pg-font-family);
			font-size: var(--pg-font-size-sm);
			color: var(--pg-text-secondary);
			max-width: 240px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		@media only screen and (max-width: 768px) {
			display: none;
		}
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.hamburger {
		color: var(--pg-text);
		padding: 4px;
	}

	.mobile-nav {
		display: flex;
		flex-direction: column;
		padding: 0.5rem 1.5rem 1rem;
		border-top: 1px solid var(--pg-strong-background);

		.mobile-user {
			font-family: var(--pg-font-family);
			font-size: var(--pg-font-size-sm);
			color: var(--pg-text-secondary);
			padding: 0.75rem 0 0.25rem;
		}

		a {
			font-family: var(--pg-font-family);
			font-size: var(--pg-font-size-lg);
			font-weight: var(--pg-font-weight-medium);
			text-decoration: none;
			color: var(--pg-text);
			padding: 0.75rem 0;
			border-bottom: 1px solid var(--pg-soft-background);

			&:hover {
				color: var(--pg-primary);
			}
		}
	}
</style>
