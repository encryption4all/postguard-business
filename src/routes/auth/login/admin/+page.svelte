<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import YiviLogin from '$lib/components/YiviLogin.svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleSuccess() {
		goto('/admin/organizations');
	}
</script>

<SEO title="Admin Login" />

<section class="login-page">
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
		line-height: 1.5;
	}

	.login-content {
		padding: 1rem 0;
	}
</style>
