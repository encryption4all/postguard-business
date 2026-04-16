<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import YiviLogin from '$lib/components/YiviLogin.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let loginType = $state<'org' | 'admin'>('org');

	const redirectTo = $derived(page.url.searchParams.get('redirect') ?? '/portal/dashboard');

	function handleSuccess() {
		goto(loginType === 'admin' ? '/admin/organizations' : redirectTo);
	}
</script>

<SEO title="Login" description="Log in to your PostGuard for Business account." />

<section class="login-page">
	<div class="login-card">
		<h1>Log in</h1>
		<p class="login-subtitle">
			Authenticate with your Yivi app to access your organization portal.
		</p>

		<div class="login-tabs" role="tablist">
			<button
				role="tab"
				class="tab"
				class:active={loginType === 'org'}
				aria-selected={loginType === 'org'}
				onclick={() => (loginType = 'org')}
			>
				Organization
			</button>
			<button
				role="tab"
				class="tab"
				class:active={loginType === 'admin'}
				aria-selected={loginType === 'admin'}
				onclick={() => (loginType = 'admin')}
			>
				Admin
			</button>
		</div>

		<div class="login-content">
			{#if loginType === 'org'}
				<p class="login-hint">
					Disclose your organization email address to log in.
				</p>
			{:else}
				<p class="login-hint">
					Disclose your full name, email address, and phone number to log in as an
					administrator.
				</p>
			{/if}

			<YiviLogin type={loginType} onSuccess={handleSuccess} />
		</div>

		<p class="login-footer">
			Don't have an account? <a href="/register">Register your organization</a>
		</p>
	</div>
</section>

<style lang="scss">
	.login-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 80vh;
		padding: 3rem 1.5rem;
		background: linear-gradient(
			180deg,
			var(--pg-soft-background) 0%,
			var(--pg-general-background) 100%
		);
	}

	.login-card {
		width: 100%;
		max-width: 440px;
		background: var(--pg-general-background);
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

	.login-tabs {
		display: flex;
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-md);
		margin-bottom: 1.5rem;
		overflow: hidden;
	}

	.tab {
		flex: 1;
		padding: 0.6rem;
		font-size: var(--pg-font-size-sm);
		font-weight: var(--pg-font-weight-medium);
		color: var(--pg-text-secondary);
		background: transparent;
		border: none;
		transition:
			background 0.2s,
			color 0.2s;

		&.active {
			background: var(--pg-primary);
			color: #fff;
		}
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
