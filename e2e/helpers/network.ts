import type { BrowserContext } from '@playwright/test';

export async function setOffline(context: BrowserContext) {
  await context.setOffline(true);
}

export async function setOnline(context: BrowserContext) {
  await context.setOffline(false);
}

export async function waitForNetworkIdle(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
}
