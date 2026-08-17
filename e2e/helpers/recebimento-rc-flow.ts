import { expect, type Page } from '@playwright/test';

import { E2E_PWA_URL, E2E_WEB_URL } from './auth';
import { captureAvariaPhotos, captureChecklistPhoto } from './photos';

export const EXTRA_ITEM_SKU = process.env.E2E_EXTRA_ITEM_SKU ?? '640112482';

const CHECKLIST_PHOTOS = [
  'Tirar foto: Foto do lacre',
  'Tirar foto: Baú fechado',
  'Tirar foto: Baú aberto',
] as const;

const CHECKLIST_CONDITIONS = [
  'Limpeza Interna',
  'Ausência de Odor',
  'Integridade Estrutural',
  'Vedação das Portas',
] as const;

export async function liberateFirstAguardandoDemand(page: Page): Promise<string> {
  await page.goto(`${E2E_WEB_URL}/recebimento`);
  await page.waitForLoadState('networkidle');

  const aguardandoRow = page.locator('tr').filter({ hasText: 'Aguardando' }).first();
  await expect(aguardandoRow).toBeVisible({ timeout: 60_000 });

  const detailLink = aguardandoRow.getByRole('link').first();
  await detailLink.click();
  await page.waitForURL(/\/recebimento\/[^/]+$/, { timeout: 30_000 });

  const demandId = page.url().split('/').pop();
  if (!demandId) {
    throw new Error('Não foi possível obter o ID da demanda liberada');
  }

  await page.getByRole('button', { name: /Liberar p\/ conferência|Liberar$/ }).click();
  await expect(page.getByText('Liberar para conferência')).toBeVisible();

  const availableDock = page.getByRole('button', { name: /Doca .*, livre/ }).first();
  await expect(availableDock).toBeVisible({ timeout: 30_000 });
  await availableDock.click();

  await page.getByRole('button', { name: 'Liberar conferência' }).click();
  await expect(page.getByText('Liberado p/ conferência')).toBeVisible({ timeout: 30_000 });

  return demandId;
}

export async function waitForDemandOnPwa(page: Page, demandId: string) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc`);
  await page.waitForLoadState('networkidle');

  const demandLink = page.locator(`a[href*="/recebimento-rc/${demandId}"]`).first();
  await expect(demandLink).toBeVisible({ timeout: 90_000 });
  return demandLink;
}

export async function completeChecklistOffline(page: Page, demandId: string) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/checklist`);
  await page.waitForLoadState('domcontentloaded');

  const dockSelect = page.locator('#dock');
  if (await dockSelect.isVisible()) {
    const options = dockSelect.locator('option');
    const optionCount = await options.count();
    for (let index = 0; index < optionCount; index += 1) {
      const value = await options.nth(index).getAttribute('value');
      if (value) {
        await dockSelect.selectOption(value);
        break;
      }
    }
  }

  await page.locator('#lacre').fill('E2E-123456');

  for (const condition of CHECKLIST_CONDITIONS) {
    const toggle = page.getByRole('switch', { name: condition });
    if ((await toggle.getAttribute('aria-checked')) !== 'true') {
      await toggle.click();
    }
  }

  for (const photoLabel of CHECKLIST_PHOTOS) {
    await captureChecklistPhoto(page, photoLabel);
  }

  await page.getByRole('button', { name: /Salvar e iniciar conferência|Atualizar e continuar/ }).click();
  await page.waitForURL(new RegExp(`/recebimento-rc/${demandId}/itens`), {
    timeout: 60_000,
  });
}

export async function addExtraItem(page: Page, demandId: string, sku = EXTRA_ITEM_SKU) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/itens`);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await expect(page.getByText('Informar produto')).toBeVisible();

  await page.locator('#sku-produto-v2').fill(sku);
  await page.getByRole('button', { name: 'Conferir' }).click();

  await page.waitForURL(
    (url) => url.pathname.includes(demandId) && url.search.includes(`sku=${sku}`),
    { timeout: 90_000 },
  );

  await expect(page.getByText(sku, { exact: false })).toBeVisible();
}

export async function conferItem(page: Page, demandId: string, sku = EXTRA_ITEM_SKU) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/?sku=${sku}`);
  await page.waitForLoadState('domcontentloaded');

  const caixaInput = page.locator('#recebida-caixa');
  if (await caixaInput.isVisible()) {
    await caixaInput.fill('1');
  }

  const unidadeInput = page.locator('#recebida-unidade');
  if (await unidadeInput.isVisible()) {
    await unidadeInput.fill('1');
  }

  await page.getByRole('button', { name: 'Conferir' }).click();
  await expect(page.getByText('Registrando...')).toBeHidden({ timeout: 60_000 });
}

export async function fillTemperaturas(page: Page, demandId: string) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/itens`);
  await page.getByRole('button', { name: /Temp\./ }).click();
  await expect(page.getByText('Temperatura por etapa')).toBeVisible();

  for (const fieldId of ['temp-rc-inicio', 'temp-rc-meio', 'temp-rc-fim'] as const) {
    await page.locator(`#${fieldId}`).fill('-18');
    await page.locator(`#${fieldId}`).blur();
    await page.waitForTimeout(500);
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

async function fillAvariaForm(page: Page, tipoValue: string) {
  await page.locator('#natureza').selectOption('5');
  await page.locator('#tipo').selectOption(tipoValue);
  await page.locator('#causa').selectOption('1');

  const caixaInput = page.locator('#quantidadeCaixa');
  if (await caixaInput.isVisible()) {
    await caixaInput.fill('1');
  }

  const unidadeInput = page.locator('#quantidadeUnidade');
  if (await unidadeInput.isVisible()) {
    await unidadeInput.fill('1');
  }

  await captureAvariaPhotos(page, 2);
  await page.getByRole('button', { name: 'Salvar avaria' }).click();
  await expect(page.getByText('Salvando...')).toBeHidden({ timeout: 60_000 });
}

export async function runAvariaAddRemoveAddFlow(
  page: Page,
  demandId: string,
  sku = EXTRA_ITEM_SKU,
) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/avarias?sku=${sku}`);
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByText('Nova avaria')).toBeVisible({ timeout: 30_000 });

  await fillAvariaForm(page, '1');
  await expect(page.getByRole('button', { name: 'Remover avaria' })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole('button', { name: 'Remover avaria' }).click();
  await expect(page.getByRole('button', { name: 'Remover avaria' })).toHaveCount(0, {
    timeout: 30_000,
  });

  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/avarias?sku=${sku}`);
  await expect(page.getByText('Nova avaria')).toBeVisible({ timeout: 30_000 });
  await fillAvariaForm(page, '2');
  await expect(page.getByRole('button', { name: 'Remover avaria' })).toBeVisible({
    timeout: 30_000,
  });
}

export async function finalizeConferenceOffline(page: Page, demandId: string) {
  await page.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/resumo`);
  await page.waitForLoadState('domcontentloaded');

  await expect(page.getByText(EXTRA_ITEM_SKU)).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Finalizar e liberar doca' }).click();
  await page.locator('#quantidade-paletes-recebidos-rc').fill('1');
  await page.getByRole('button', { name: 'Confirmar e liberar doca' }).click();

  await page.waitForURL(/\/recebimento-rc\/?$/, { timeout: 90_000 });
}

export async function verifyDemandOnWeb(page: Page, demandId: string, sku = EXTRA_ITEM_SKU) {
  await page.goto(`${E2E_WEB_URL}/recebimento/${demandId}`);
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Conferido')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(sku)).toBeVisible();
  await expect(page.getByText(/avaria/i)).toBeVisible();
}
