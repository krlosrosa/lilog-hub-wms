import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Page } from '@playwright/test';

/** 1x1 PNG used for checklist and avaria photo uploads. */
export const TEST_PHOTO_PATH = join(process.cwd(), 'e2e', 'fixtures', 'test-photo.png');

export function ensureTestPhotoFixture() {
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  writeFileSync(TEST_PHOTO_PATH, Buffer.from(pngBase64, 'base64'));
}

export async function uploadPhotoFromDevice(page: Page) {
  const pickButton = page.getByRole('button', { name: 'Selecionar arquivo do dispositivo' });
  await pickButton.waitFor({ state: 'visible', timeout: 15_000 });
  await pickButton.click();

  const fileInput = page.locator('input[type="file"]').last();
  await fileInput.setInputFiles(TEST_PHOTO_PATH);

  await page.waitForTimeout(1_500);
}

export async function captureChecklistPhoto(page: Page, ariaLabel: string) {
  await page.getByRole('button', { name: ariaLabel }).click();
  await uploadPhotoFromDevice(page);
}

export async function captureAvariaPhotos(page: Page, count = 2) {
  for (let index = 0; index < count; index += 1) {
    await page.getByRole('button', { name: 'Capturar' }).click();
    await uploadPhotoFromDevice(page);
  }
}
