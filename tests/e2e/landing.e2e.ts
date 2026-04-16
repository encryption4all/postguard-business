import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
	test('should display the hero section', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toContainText('Secure email signing');
	});

	test('should display feature cards', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.feature-card')).toHaveCount(6);
	});

	test('should have working navigation links', async ({ page }) => {
		await page.goto('/');
		const header = page.locator('header');
		await expect(header).toBeVisible();
		await expect(header.locator('a.logo')).toBeVisible();
	});

	test('should have a CTA section with register link', async ({ page }) => {
		await page.goto('/');
		const cta = page.locator('.cta');
		await expect(cta).toBeVisible();
		await expect(cta.locator('a.primary-btn')).toContainText('Register');
	});

	test('should have a footer', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('footer')).toBeVisible();
	});
});
