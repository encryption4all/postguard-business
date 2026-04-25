<script lang="ts">
	import { _ } from 'svelte-i18n';
	import SEO from '$lib/components/SEO.svelte';
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';
	import '@privacybydesign/yivi-css';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: FormResult | null } = $props();

	interface FormResult {
		success?: boolean;
		errors?: Record<string, string>;
		values?: Record<string, string | null | undefined>;
	}

	let yiviStatus = $state<'idle' | 'running' | 'done' | 'error'>('idle');
	let yiviError = $state('');
	let disclosed = $state<{ email: string; fullName: string; phone: string | null } | null>(null);
	let derivedDomain = $state('');

	async function startYiviFlow() {
		yiviStatus = 'running';
		yiviError = '';

		try {
			const { YiviCore } = await import('@privacybydesign/yivi-core');
			const { YiviWeb } = await import('@privacybydesign/yivi-web');
			const { YiviClient } = await import('@privacybydesign/yivi-client');

			const attrs = data.yiviAttrs;
			let irmaToken = '';

			const yivi = new YiviCore({
				debugging: false,
				element: '#yivi-register-container',
				language: 'en',
				minimal: true,
				session: {
					url: '/irma',
					start: {
						url: (o: any) => `${o.url}/session`,
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							'@context': 'https://irma.app/ld/request/disclosure/v2',
							disclose: [[[attrs.email]], [[attrs.fullName]], [[attrs.phone]]]
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

			// Verify the disclosure and get attributes
			const response = await fetch('/api/auth/yivi/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ irmaSessionToken: irmaToken })
			});

			if (!response.ok) {
				const err = await response.json();
				yiviStatus = 'error';
				yiviError = err.message ?? 'Verification failed';
				return;
			}

			const { attributes } = await response.json();
			disclosed = {
				email: attributes.email,
				fullName: attributes.fullName,
				phone: attributes.phone ?? null
			};

			// Derive domain from email
			const at = attributes.email.indexOf('@');
			if (at > 0) {
				derivedDomain = attributes.email.substring(at + 1).toLowerCase();
			}

			yiviStatus = 'done';
		} catch (e: unknown) {
			if (yiviStatus === 'running') {
				yiviStatus = 'error';
				yiviError = e instanceof Error ? e.message : 'Yivi session failed. Please try again.';
			}
		}
	}

	function retryYivi() {
		yiviStatus = 'idle';
		yiviError = '';
		disclosed = null;
	}
</script>

<SEO
	title={$_('register.title')}
	description={$_('register.seoDescription')}
/>

<section class="register">
	<div class="register-card">
		{#if form?.success}
			<div class="success-message">
				<Icon icon="mdi:check-circle" width="48" height="48" />
				<h1>{$_('register.submitted')}</h1>
				<p>
					{$_('register.submittedMessage')}
				</p>
				<a href="/" class="secondary-btn">{$_('register.backHome')}</a>
			</div>
		{:else if yiviStatus === 'idle' || yiviStatus === 'running' || yiviStatus === 'error'}
			<h1>{$_('register.heading')}</h1>
			<p class="register-subtitle">
				{$_('register.subtitle')}
			</p>

			{#if yiviStatus === 'idle'}
				<div class="yivi-section">
					<button class="primary-btn yivi-btn" onclick={startYiviFlow}>
						<Icon icon="mdi:qrcode-scan" width="20" height="20" />
						{$_('register.verifyBtn')}
					</button>
				</div>
			{:else if yiviStatus === 'running'}
				<div class="yivi-section">
					<div id="yivi-register-container" class="yivi-container"></div>
					<p class="yivi-hint">{$_('register.yiviHint')}</p>
				</div>
			{:else if yiviStatus === 'error'}
				<div class="yivi-section error-state">
					<Icon icon="mdi:alert-circle" width="32" height="32" />
					<p>{yiviError}</p>
					<button class="secondary-btn" onclick={retryYivi}>{$_('auth.tryAgain')}</button>
				</div>
			{/if}
		{:else if disclosed}
			<h1>{$_('register.completeTitle')}</h1>
			<p class="register-subtitle">
				{$_('register.completeSubtitle')}
			</p>

			{#if form?.errors?.form}
				<div class="form-error" role="alert">
					<Icon icon="mdi:alert-circle" width="20" height="20" />
					<span>{form.errors.form}</span>
				</div>
			{/if}

			<div class="disclosed-info">
				<div class="disclosed-field">
					<span class="disclosed-label">{$_('register.fullName')}</span>
					<span class="disclosed-value">{disclosed.fullName}</span>
				</div>
				<div class="disclosed-field">
					<span class="disclosed-label">{$_('register.email')}</span>
					<span class="disclosed-value">{disclosed.email}</span>
				</div>
				{#if disclosed.phone}
					<div class="disclosed-field">
						<span class="disclosed-label">{$_('register.phone')}</span>
						<span class="disclosed-value">{disclosed.phone}</span>
					</div>
				{/if}
				<div class="disclosed-badge">
					<Icon icon="mdi:check-decagram" width="16" height="16" />
					{$_('register.verifiedYivi')}
				</div>
			</div>

			<form method="POST" use:enhance>
				<input type="hidden" name="email" value={disclosed.email} />
				<input type="hidden" name="contactName" value={disclosed.fullName} />
				<input type="hidden" name="phone" value={disclosed.phone ?? ''} />
				<input type="hidden" name="domain" value={derivedDomain} />

				<div class="form-group">
					<label for="name">{$_('register.orgName')} *</label>
					<input
						id="name"
						name="name"
						type="text"
						class="pg-input"
						placeholder={$_('register.orgNamePlaceholder')}
						value={form?.values?.name ?? ''}
						required
					/>
					{#if form?.errors?.name}
						<span class="field-error">{form.errors.name}</span>
					{/if}
				</div>

				{#if form?.errors?.domain}
					<div class="form-error" role="alert">
						<Icon icon="mdi:alert-circle" width="20" height="20" />
						<span>{form.errors.domain}</span>
					</div>
				{/if}

				<button type="submit" class="primary-btn submit-btn">{$_('register.submit')}</button>
			</form>
		{/if}
	</div>
</section>

<style lang="scss">
	.register {
		display: flex;
		justify-content: center;
		padding: 3rem 1.5rem 4rem;
		background: linear-gradient(
			180deg,
			var(--pg-soft-background) 0%,
			var(--pg-general-background) 100%
		);
		flex: 1;
	}

	.register-card {
		width: 100%;
		max-width: 560px;

		h1 {
			font-size: var(--pg-font-size-2xl);
			margin-bottom: 0.5rem;
		}
	}

	.register-subtitle {
		color: var(--pg-text-secondary);
		margin-bottom: 2rem;
		line-height: 1.5;
	}

	.yivi-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem 0;
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

	.yivi-hint {
		max-width: 300px;
		text-align: center;
		line-height: 1.5;
		color: var(--pg-text-secondary);
		margin-top: 1rem;
	}

	.error-state {
		gap: 1rem;
		text-align: center;

		:global(svg) {
			color: var(--pg-input-error);
		}

		p {
			color: var(--pg-input-error);
		}
	}

	.disclosed-info {
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.disclosed-field {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--pg-strong-background);

		&:last-of-type {
			border-bottom: none;
		}
	}

	.disclosed-label {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: var(--pg-font-weight-medium);
	}

	.disclosed-value {
		font-size: var(--pg-font-size-md);
		font-weight: var(--pg-font-weight-medium);
	}

	.disclosed-badge {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.75rem;
		font-size: var(--pg-font-size-xs);
		font-weight: var(--pg-font-weight-bold);
		color: #16a34a;

		:global(svg) {
			color: #16a34a;
		}
	}

	.form-error {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(182, 22, 22, 0.08);
		border: 1px solid var(--pg-input-error);
		border-radius: var(--pg-border-radius-md);
		padding: 0.75rem 1rem;
		margin-bottom: 1.5rem;
		color: var(--pg-input-error);
		font-size: var(--pg-font-size-sm);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;

		label {
			font-size: var(--pg-font-size-sm);
			font-weight: var(--pg-font-weight-medium);
			color: var(--pg-text);
		}
	}

	.field-error {
		font-size: var(--pg-font-size-xs);
		color: var(--pg-input-error);
	}

	.submit-btn {
		margin-top: 0.5rem;
		width: 100%;
		justify-content: center;
	}

	.success-message {
		text-align: center;
		padding: 2rem 0;

		:global(svg) {
			color: var(--pg-primary);
			margin-bottom: 1rem;
		}

		h1 {
			margin-bottom: 1rem;
		}

		p {
			color: var(--pg-text-secondary);
			line-height: 1.6;
			margin-bottom: 2rem;
		}
	}
</style>
