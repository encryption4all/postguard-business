<script lang="ts">
	import Icon from '@iconify/svelte';

	let {
		type = 'org',
		onSuccess
	}: {
		type: 'org' | 'admin';
		onSuccess: (data: { userType: string }) => void;
	} = $props();

	let status = $state<'idle' | 'loading' | 'waiting' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let yiviToken = $state('');
	let sessionPtr = $state<unknown>(null);
	let pollInterval = $state<ReturnType<typeof setInterval> | null>(null);

	async function startSession() {
		status = 'loading';
		errorMessage = '';

		try {
			const response = await fetch('/api/auth/yivi/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type })
			});

			if (!response.ok) throw new Error('Failed to start Yivi session');

			const data = await response.json();
			yiviToken = data.token;
			sessionPtr = data.sessionPtr;
			status = 'waiting';

			// Poll for result
			pollInterval = setInterval(checkResult, 2000);
		} catch {
			status = 'error';
			errorMessage = 'Could not start Yivi session. Please try again.';
		}
	}

	async function checkResult() {
		if (!yiviToken) return;

		try {
			const response = await fetch('/api/auth/yivi/callback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: yiviToken, type })
			});

			if (response.ok) {
				if (pollInterval) clearInterval(pollInterval);
				status = 'success';
				const data = await response.json();
				onSuccess(data);
			} else if (response.status === 401) {
				// Still waiting for disclosure
			} else {
				if (pollInterval) clearInterval(pollInterval);
				const err = await response.json();
				status = 'error';
				errorMessage = err.message ?? 'Authentication failed';
			}
		} catch {
			// Network error, keep polling
		}
	}

	function cancel() {
		if (pollInterval) clearInterval(pollInterval);
		status = 'idle';
		yiviToken = '';
		sessionPtr = null;
	}
</script>

<div class="yivi-login">
	{#if status === 'idle'}
		<button class="primary-btn yivi-btn" onclick={startSession}>
			<Icon icon="mdi:qrcode-scan" width="20" height="20" />
			{type === 'admin' ? 'Login as admin with Yivi' : 'Login with Yivi'}
		</button>
	{:else if status === 'loading'}
		<div class="yivi-status">
			<Icon icon="mdi:loading" width="32" height="32" class="spin" />
			<p>Starting Yivi session...</p>
		</div>
	{:else if status === 'waiting'}
		<div class="yivi-status">
			<div class="qr-placeholder">
				<Icon icon="mdi:qrcode" width="120" height="120" />
				<p class="qr-hint">Scan with your Yivi app</p>
			</div>
			<p class="waiting-text">
				{#if type === 'admin'}
					Please disclose your name, email, and phone number.
				{:else}
					Please disclose your organization email address.
				{/if}
			</p>
			<button class="secondary-btn" onclick={cancel}>Cancel</button>
		</div>
	{:else if status === 'success'}
		<div class="yivi-status success">
			<Icon icon="mdi:check-circle" width="48" height="48" />
			<p>Authentication successful! Redirecting...</p>
		</div>
	{:else if status === 'error'}
		<div class="yivi-status error">
			<Icon icon="mdi:alert-circle" width="32" height="32" />
			<p>{errorMessage}</p>
			<button class="secondary-btn" onclick={startSession}>Try again</button>
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

	.qr-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem;
		background: var(--pg-soft-background);
		border-radius: var(--pg-border-radius-lg);
		color: var(--pg-text-secondary);
	}

	.qr-hint {
		font-size: var(--pg-font-size-sm);
		font-weight: var(--pg-font-weight-medium);
	}

	.waiting-text {
		max-width: 300px;
		line-height: 1.5;
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
