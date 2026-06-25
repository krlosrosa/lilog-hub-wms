import { describe, expect, it } from 'vitest';

import { computePausaAtivaDeslocamentoMs } from '@/features/pausas/lib/pausa-previsao';

describe('computePausaAtivaDeslocamentoMs', () => {
  it('retorna 0 quando nao ha pausa ativa', () => {
    expect(computePausaAtivaDeslocamentoMs(null)).toBe(0);
    expect(computePausaAtivaDeslocamentoMs(undefined)).toBe(0);
  });

  it('retorna tempo corrido em ms desde o inicio da pausa', () => {
    const now = new Date('2026-06-22T16:10:00.000Z');
    const deslocamento = computePausaAtivaDeslocamentoMs(
      '2026-06-22T16:05:00.000Z',
      now,
    );

    expect(deslocamento).toBe(5 * 60_000);
  });

  it('nao retorna valor negativo', () => {
    const now = new Date('2026-06-22T16:00:00.000Z');
    const deslocamento = computePausaAtivaDeslocamentoMs(
      '2026-06-22T16:05:00.000Z',
      now,
    );

    expect(deslocamento).toBe(0);
  });
});
