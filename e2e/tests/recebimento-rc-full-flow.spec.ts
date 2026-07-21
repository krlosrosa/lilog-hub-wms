import { expect, test } from '@playwright/test';

import { E2E_PWA_URL } from '../helpers/auth';
import { setOffline, setOnline } from '../helpers/network';
import {
  addExtraItem,
  completeChecklistOffline,
  conferItem,
  EXTRA_ITEM_SKU,
  fillTemperaturas,
  finalizeConferenceOffline,
  liberateFirstAguardandoDemand,
  runAvariaAddRemoveAddFlow,
  verifyDemandOnWeb,
  waitForDemandOnPwa,
} from '../helpers/recebimento-rc-flow';

test.describe('Recebimento RC full offline flow', () => {
  test('libera na web, confere offline no PWA e valida sync na web', async ({ browser }) => {
    test.setTimeout(300_000);

    const webContext = await browser.newContext({
      storageState: 'e2e/.auth/web.json',
    });
    const webPage = await webContext.newPage();

    const pwaContext = await browser.newContext({
      storageState: 'e2e/.auth/pwa.json',
    });
    const pwaPage = await pwaContext.newPage();

    const demandId = await liberateFirstAguardandoDemand(webPage);

    const demandLink = await waitForDemandOnPwa(pwaPage, demandId);
    await demandLink.click();
    await pwaPage.waitForLoadState('networkidle');

    await setOffline(pwaContext);

    if (pwaPage.url().includes('/checklist')) {
      await completeChecklistOffline(pwaPage, demandId);
    } else {
      await pwaPage.goto(`${E2E_PWA_URL}/recebimento-rc/${demandId}/checklist`);
      await completeChecklistOffline(pwaPage, demandId);
    }

    await addExtraItem(pwaPage, demandId, EXTRA_ITEM_SKU);
    await conferItem(pwaPage, demandId, EXTRA_ITEM_SKU);
    await fillTemperaturas(pwaPage, demandId);
    await runAvariaAddRemoveAddFlow(pwaPage, demandId, EXTRA_ITEM_SKU);
    await finalizeConferenceOffline(pwaPage, demandId);

    await expect(pwaPage.getByText(/Conferido|Pronto/i)).toBeVisible({ timeout: 30_000 });

    await setOnline(pwaContext);
    await pwaPage.waitForLoadState('networkidle');
    await pwaPage.waitForTimeout(5_000);

    await verifyDemandOnWeb(webPage, demandId, EXTRA_ITEM_SKU);

    await webContext.close();
    await pwaContext.close();
  });
});
