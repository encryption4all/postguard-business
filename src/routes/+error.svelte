<script lang="ts">
	import { page } from '$app/state';
	import Icon from '@iconify/svelte';
</script>

<div class="error-page">
	<div class="error-card">
		<Icon
			icon={page.status === 404 ? 'mdi:file-search-outline' : 'mdi:alert-circle-outline'}
			width="56"
			height="56"
		/>
		<h1>{page.status}</h1>
		<p>{page.error?.message || 'Something went wrong'}</p>
		<a href="/" class="secondary-btn">Back to home</a>
	</div>
</div>

<style lang="scss">
	.error-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		padding: 2rem;
		background: var(--pg-general-background);
	}

	.error-card {
		text-align: center;
		max-width: 400px;

		:global(svg) {
			color: var(--pg-text-secondary);
			margin-bottom: 1rem;
		}

		h1 {
			font-size: 3rem;
			margin: 0 0 0.5rem;
		}

		p {
			color: var(--pg-text-secondary);
			font-size: var(--pg-font-size-lg);
			line-height: 1.5;
			margin-bottom: 2rem;
		}
	}
</style>
