<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Icon from '@iconify/svelte';
	import logoLight from '$lib/assets/images/logo.svg';
	import logoDark from '$lib/assets/images/logo-dark.svg';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	let sidebarOpen = $state(false);

	const navItems = $derived([
		{ href: '/portal/dashboard', label: $_('nav.dashboard'), icon: 'mdi:view-dashboard' },
		...(data.featureFlags.apiKeys
			? [{ href: '/portal/api-keys', label: $_('nav.apiKeys'), icon: 'mdi:key-variant' }]
			: []),
		...(data.featureFlags.orgInfo
			? [{ href: '/portal/organization', label: $_('nav.organization'), icon: 'mdi:office-building' }]
			: []),
		...(data.featureFlags.emailLog
			? [{ href: '/portal/email-log', label: $_('nav.emailLog'), icon: 'mdi:email-search' }]
			: []),
		...(data.featureFlags.members
			? [{ href: '/portal/members', label: $_('nav.members'), icon: 'mdi:account-group' }]
			: []),
		...(data.featureFlags.dns
			? [{ href: '/portal/dns', label: $_('nav.dns'), icon: 'mdi:dns' }]
			: [])
	]);
</script>

<div class="layout-shell">
{#if data.isImpersonating}
	<div class="impersonation-bar">
		<Icon icon="mdi:eye" width="16" height="16" />
		<span>{$_('admin.viewingAs', { values: { orgName: data.organization.name } })}</span>
		<form method="POST" action="/api/admin/impersonate/stop">
			<button type="submit" class="stop-btn">{$_('admin.stopImpersonating')}</button>
		</form>
	</div>
{/if}

<div class="portal">
	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<a href="/" class="sidebar-logo">
				<img src={logoLight} alt="PostGuard" class="logo-img light-only" height="22" /><img src={logoDark} alt="PostGuard" class="logo-img dark-only" height="22" />
				<span class="logo-badge">Business</span>
			</a>
			<button class="sidebar-close desktop-hide" onclick={() => (sidebarOpen = false)}>
				<Icon icon="mdi:close" width="20" height="20" />
			</button>
		</div>

		<div class="sidebar-org">
			<p class="org-name">{data.organization.name}</p>
			<p class="org-domain">{data.organization.domain}</p>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				<a href={item.href} class="nav-item" onclick={() => (sidebarOpen = false)}>
					<Icon icon={item.icon} width="20" height="20" />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<form method="POST" action="/auth/logout">
				<button type="submit" class="nav-item logout-btn">
					<Icon icon="mdi:logout" width="20" height="20" />
					<span>{$_('nav.logout')}</span>
				</button>
			</form>
		</div>
	</aside>

	<div class="portal-main">
		<header class="portal-header">
			<button class="hamburger desktop-hide" onclick={() => (sidebarOpen = true)}>
				<Icon icon="mdi:menu" width="24" height="24" />
			</button>
			<h2 class="portal-title">{data.organization.name}</h2>
			<div class="header-actions">
				<LocaleSwitcher />
				<ThemeSwitcher />
			</div>
		</header>
		<div class="portal-content">
			{@render children()}
		</div>
	</div>
</div>
</div>

{#if sidebarOpen}
	<div class="sidebar-overlay desktop-hide" role="presentation" onclick={() => (sidebarOpen = false)}></div>
{/if}

<style lang="scss">
	.impersonation-bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: #b45309;
		color: #fff;
		padding: 0.5rem;
		font-size: var(--pg-font-size-sm);
		font-family: var(--pg-font-family);

		:global(svg) {
			color: #fff;
		}
	}

	.stop-btn {
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		font-size: var(--pg-font-size-xs);
		padding: 2px 10px;
		border-radius: 100px;
		font-family: var(--pg-font-family);
		font-weight: var(--pg-font-weight-medium);

		&:hover {
			background: rgba(255, 255, 255, 0.3);
		}
	}

	.layout-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.portal {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.sidebar {
		width: 260px;
		background: var(--pg-soft-background);
		border-right: 1px solid var(--pg-strong-background);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		position: sticky;
		top: 0;
		height: 100vh;
		overflow-y: auto;

		@media only screen and (max-width: 768px) {
			position: fixed;
			left: -260px;
			z-index: 200;
			transition: left 0.2s ease;

			&.open {
				left: 0;
			}
		}
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--pg-strong-background);
	}

	.sidebar-logo {
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
		background: var(--pg-primary-bg);
		color: #fff;
		padding: 2px 6px;
		border-radius: var(--pg-border-radius-sm);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.sidebar-close {
		color: var(--pg-text-secondary);
	}

	.sidebar-org {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--pg-strong-background);

		.org-name {
			font-weight: var(--pg-font-weight-bold);
			font-size: var(--pg-font-size-md);
			margin: 0;
		}

		.org-domain {
			font-size: var(--pg-font-size-xs);
			color: var(--pg-text-secondary);
			margin: 0.15rem 0 0;
		}
	}

	.sidebar-nav {
		flex: 1;
		padding: 0.75rem 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 1.25rem;
		font-family: var(--pg-font-family);
		font-size: var(--pg-font-size-md);
		font-weight: var(--pg-font-weight-medium);
		color: var(--pg-text-secondary);
		text-decoration: none;
		transition: background 0.15s, color 0.15s;

		&:hover {
			background: var(--pg-strong-background);
			color: var(--pg-text);
		}
	}

	.sidebar-footer {
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--pg-strong-background);
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.logout-btn {
		width: 100%;
		color: var(--pg-text-secondary);
		border: none;
		background: none;
		cursor: pointer;
		font-family: var(--pg-font-family);
	}

	.portal-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.portal-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--pg-strong-background);
		background: var(--pg-general-background);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.header-actions {
		margin-left: auto;
	}

	.portal-title {
		font-size: var(--pg-font-size-lg);
		margin: 0;
	}

	.hamburger {
		color: var(--pg-text);
	}

	.portal-content {
		flex: 1;
		padding: 1.5rem;
		max-width: 1000px;
		width: 100%;
	}

	.sidebar-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 199;
	}
</style>
