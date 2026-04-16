<script lang="ts">
	import Icon from '@iconify/svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
	let sidebarOpen = $state(false);

	const navItems = $derived([
		{ href: '/portal/dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard' },
		{ href: '/portal/api-keys', label: 'API Keys', icon: 'mdi:key-variant' },
		{ href: '/portal/organization', label: 'Organization', icon: 'mdi:office-building' },
		...(data.featureFlags.emailLog
			? [{ href: '/portal/email-log', label: 'Email Log', icon: 'mdi:email-search' }]
			: []),
		{ href: '/portal/dns', label: 'DNS Verification', icon: 'mdi:dns' }
	]);
</script>

<div class="portal">
	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<a href="/" class="sidebar-logo">
				<Icon icon="mdi:shield-lock" width="24" height="24" />
				<span>PostGuard</span>
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
			<ThemeSwitcher />
			<form method="POST" action="/auth/logout">
				<button type="submit" class="nav-item logout-btn">
					<Icon icon="mdi:logout" width="20" height="20" />
					<span>Log out</span>
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
		</header>
		<div class="portal-content">
			{@render children()}
		</div>
	</div>
</div>

{#if sidebarOpen}
	<div class="sidebar-overlay desktop-hide" role="presentation" onclick={() => (sidebarOpen = false)}></div>
{/if}

<style lang="scss">
	.portal {
		display: flex;
		min-height: 100vh;
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
		font-weight: var(--pg-font-weight-extrabold);
		font-size: var(--pg-font-size-lg);
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
