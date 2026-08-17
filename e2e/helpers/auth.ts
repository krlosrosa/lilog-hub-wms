import { expect, type Page } from '@playwright/test';

export const E2E_LOGIN_ID = process.env.E2E_LOGIN_ID ?? '421931';
export const E2E_LOGIN_PASSWORD = process.env.E2E_LOGIN_PASSWORD ?? '123456';
export const E2E_WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
export const E2E_PWA_URL = process.env.E2E_PWA_URL ?? 'http://localhost:5174';

export async function loginWeb(page: Page) {
  await page.goto(`${E2E_WEB_URL}/login`);
  await page.locator('#loginId').fill(E2E_LOGIN_ID);
  await page.locator('#password').fill(E2E_LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar no portal' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 30_000,
  });
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function loginPwa(page: Page) {
  await page.goto(`${E2E_PWA_URL}/login`);
  await page.locator('#login-id').fill(E2E_LOGIN_ID);
  await page.locator('#login-password').fill(E2E_LOGIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), {
    timeout: 30_000,
  });
  await expect(page).not.toHaveURL(/\/login$/);
}
