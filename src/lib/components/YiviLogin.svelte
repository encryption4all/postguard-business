<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import '@privacybydesign/yivi-css';
	import Icon from '@iconify/svelte';

	let {
		type = 'org',
		attrs,
		onSuccess
	}: {
		type: 'org' | 'admin';
		attrs: { email: string; fullName: string; phone: string };
		onSuccess: (data: { userType: string }) => void;
	} = $props();

	let status = $state<'idle' | 'running' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let irmaToken = $state('');

	async function startYiviFlow() {
		status = 'running';
		errorMessage = '';
		irmaToken = '';

		try {
			const { YiviCore } = await import('@privacybydesign/yivi-core');
			const { YiviWeb } = await import('@privacybydesign/yivi-web');
			const { YiviClient } = await import('@privacybydesign/yivi-client');

			const disclose =
				type === 'admin'
					? [[[attrs.email]], [[attrs.fullName]], [[attrs.phone]]]
					: [[[attrs.email]]];

			const yivi = new YiviCore({
				debugging: false,
				element: '#yivi-login-container',
				language: $locale?.startsWith('nl') ? 'nl' : 'en',
				minimal: true,
				session: {
					url: '/irma',
					start: {
						url: (o: any) => `${o.url}/session`,
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							'@context': 'https://irma.app/ld/request/disclosure/v2',
							disclose
						})
					},
					mapping: {
						sessionPtr: (r: any) => r.sessionPtr,
						sessionToken: (r: any) => {
							irmaToken = r.token;
							return r.token;
						},
						frontendRequest: (r: any) => r.frontendRequest
					}
				},
				state: {
					serverSentEvents: false,
					polling: {
						endpoint: 'status',
						interval: 1000,
						startState: 'INITIALIZED'
					}
				}
			});

			yivi.use(YiviWeb);
			yivi.use(YiviClient);

			await yivi.start();

			const response = await fetch('/api/auth/yivi/callback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ irmaSessionToken: irmaToken, type })
			});

			if (response.ok) {
				status = 'success';
				const data = await response.json();
				onSuccess(data);
			} else {
				const err = await response.json();
				status = 'error';
				errorMessage = err.message ?? 'Authentication failed';
			}
		} catch (e: unknown) {
			if (status === 'running') {
				status = 'error';
				errorMessage =
					e instanceof Error ? e.message : 'Yivi session failed. Please try again.';
			}
		}
	}

	function retry() {
		status = 'idle';
		errorMessage = '';
	}
</script>

<div class="yivi-login">
	{#if status === 'idle'}
		<button class="primary-btn yivi-btn" onclick={startYiviFlow}>
			<Icon icon="mdi:qrcode-scan" width="20" height="20" />
			{type === 'admin' ? $_('auth.yiviLoginAdmin') : $_('auth.yiviLoginOrg')}
		</button>
	{:else if status === 'running'}
		<div id="yivi-login-container" class="yivi-container"></div>
		<p class="waiting-text">
			{#if type === 'admin'}
				{$_('auth.yiviDiscloseAdmin')}
			{:else}
				{$_('auth.yiviDiscloseOrg')}
			{/if}
		</p>
	{:else if status === 'success'}
		<div class="yivi-status success">
			<Icon icon="mdi:check-circle" width="48" height="48" />
			<p>{$_('auth.yiviSuccess')}</p>
		</div>
	{:else if status === 'error'}
		<div class="yivi-status error">
			<Icon icon="mdi:alert-circle" width="32" height="32" />
			<p>{errorMessage}</p>
			<button class="secondary-btn" onclick={retry}>{$_('auth.tryAgain')}</button>
		</div>
	{/if}
</div>

<style lang="scss">
	.yivi-login {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.yivi-btn {
		gap: 0.5rem;
	}

	.yivi-container {
		background: #fff;
		border: 1px solid var(--pg-strong-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 4px;
		overflow: hidden;
	}

	.waiting-text {
		max-width: 300px;
		text-align: center;
		line-height: 1.5;
		color: var(--pg-text-secondary);
		margin-top: 1rem;
	}

	.yivi-status {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		text-align: center;

		p {
			color: var(--pg-text-secondary);
		}

		&.success :global(svg) {
			color: #16a34a;
		}

		&.error :global(svg) {
			color: var(--pg-input-error);
		}

		&.error p {
			color: var(--pg-input-error);
		}
	}
</style>
