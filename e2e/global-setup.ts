import { mkdirSync } from 'node:fs';

import { chromium, type FullConfig } from '@playwright/test';

import { loginPwa, loginWeb } from './helpers/auth';
import { ensureTestPhotoFixture } from './helpers/photos';

async function globalSetup(config: FullConfig) {
  mkdirSync('e2e/.auth', { recursive: true });
  mkdirSync('e2e/fixtures', { recursive: true });
  ensureTestPhotoFixture();

  const browser = await chromium.launch();

  const webContext = await browser.newContext();
  const webPage = await webContext.newPage();
  await loginWeb(webPage);
  await webContext.storageState({ path: 'e2e/.auth/web.json' });
  await webPage.close();
  await webContext.close();

  const pwaContext = await browser.newContext();
  const pwaPage = await pwaContext.newPage();
  await loginPwa(pwaPage);
  await pwaContext.storageState({ path: 'e2e/.auth/pwa.json' });
  await pwaPage.close();
  await pwaContext.close();

  await browser.close();

  void config;
}

export default globalSetup;
