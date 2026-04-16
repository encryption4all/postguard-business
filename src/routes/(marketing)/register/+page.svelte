<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';

	interface FormResult {
		success?: boolean;
		errors?: Record<string, string>;
		values?: Record<string, string | null | undefined>;
	}

	let { form }: { form: FormResult | null } = $props();
</script>

<SEO
	title="Register"
	description="Register your organization for PostGuard for Business."
/>

<section class="register">
	<div class="register-card">
		{#if form?.success}
			<div class="success-message">
				<Icon icon="mdi:check-circle" width="48" height="48" />
				<h1>Application submitted</h1>
				<p>
					Thank you for registering. We will review your application and get back to you
					within 2 business days. You will receive a confirmation email once your
					organization is approved.
				</p>
				<a href="/" class="secondary-btn">Back to home</a>
			</div>
		{:else}
			<h1>Register your organization</h1>
			<p class="register-subtitle">
				Fill in your organization details to apply for PostGuard for Business. We'll review
				your application and get back to you shortly.
			</p>

			{#if form?.errors?.form}
				<div class="form-error" role="alert">
					<Icon icon="mdi:alert-circle" width="20" height="20" />
					<span>{form.errors.form}</span>
				</div>
			{/if}

			<form method="POST" use:enhance>
				<div class="form-group">
					<label for="name">Organization name *</label>
					<input
						id="name"
						name="name"
						type="text"
						class="pg-input"
						placeholder="Acme B.V."
						value={form?.values?.name ?? ''}
						required
					/>
					{#if form?.errors?.name}
						<span class="field-error">{form.errors.name}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="domain">Domain name *</label>
					<input
						id="domain"
						name="domain"
						type="text"
						class="pg-input"
						placeholder="acme.nl"
						value={form?.values?.domain ?? ''}
						required
					/>
					{#if form?.errors?.domain}
						<span class="field-error">{form.errors.domain}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="email">Contact email *</label>
					<input
						id="email"
						name="email"
						type="email"
						class="pg-input"
						placeholder="admin@acme.nl"
						value={form?.values?.email ?? ''}
						required
					/>
					{#if form?.errors?.email}
						<span class="field-error">{form.errors.email}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="contactName">Contact person full name *</label>
					<input
						id="contactName"
						name="contactName"
						type="text"
						class="pg-input"
						placeholder="Jan de Vries"
						value={form?.values?.contactName ?? ''}
						required
					/>
					{#if form?.errors?.contactName}
						<span class="field-error">{form.errors.contactName}</span>
					{/if}
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="phone">Phone number</label>
						<input
							id="phone"
							name="phone"
							type="tel"
							class="pg-input"
							placeholder="+31 6 12345678"
							value={form?.values?.phone ?? ''}
						/>
					</div>

					<div class="form-group">
						<label for="kvkNumber">KvK number</label>
						<input
							id="kvkNumber"
							name="kvkNumber"
							type="text"
							class="pg-input"
							placeholder="12345678"
							maxlength="8"
							value={form?.values?.kvkNumber ?? ''}
						/>
						{#if form?.errors?.kvkNumber}
							<span class="field-error">{form.errors.kvkNumber}</span>
						{/if}
					</div>
				</div>

				<button type="submit" class="primary-btn submit-btn">Submit application</button>
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
		min-height: 80vh;
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

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;

		@media only screen and (max-width: 500px) {
			grid-template-columns: 1fr;
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
