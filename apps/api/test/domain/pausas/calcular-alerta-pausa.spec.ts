import { describe, expect, it } from 'vitest';

import {
  calcularAlertaPausa,
  calcularProximaPausa,
  obterReferenciaTrabalhoContinuoIso,
} from '../../../src/domain/model/pausas/calcular-alerta-pausa.js';
import type { RegrasPausaPadraoMap } from '../../../src/domain/model/configuracao-operacional/configuracao-operacional.model.js';

const REGRAS_TERMICA: RegrasPausaPadraoMap = {
  termica: {
    intervaloTrabalhoMinutos: 140,
    duracaoPausaMinutos: 20,
  },
};

describe('obterReferenciaTrabalhoContinuoIso', () => {
  it('returns null without check-in', () => {
    expect(obterReferenciaTrabalhoContinuoIso(null, [])).toBeNull();
  });

  it('uses check-in when there are no finished pauses', () => {
    const checkIn = '2026-06-22T08:00:00.000Z';

    expect(obterReferenciaTrabalhoContinuoIso(checkIn, [])).toBe(checkIn);
  });

  it('uses latest pause end when after check-in', () => {
    const checkIn = '2026-06-22T08:00:00.000Z';
    const pausas = [{ fim: '2026-06-22T10:30:00.000Z' }];

    expect(obterReferenciaTrabalhoContinuoIso(checkIn, pausas)).toBe(
      '2026-06-22T10:30:00.000Z',
    );
  });
});

describe('calcularAlertaPausa', () => {
  const referencia = '2026-06-22T08:00:00.000Z';

  it('returns null without reference', () => {
    expect(
      calcularAlertaPausa(null, new Date('2026-06-22T10:30:00.000Z'), REGRAS_TERMICA),
    ).toBeNull();
  });

  it('returns null without rules', () => {
    expect(
      calcularAlertaPausa(
        referencia,
        new Date('2026-06-22T12:00:00.000Z'),
        {},
      ),
    ).toBeNull();
  });

  it('returns null before interval', () => {
    expect(
      calcularAlertaPausa(
        referencia,
        new Date('2026-06-22T09:00:00.000Z'),
        REGRAS_TERMICA,
      ),
    ).toBeNull();
  });

  it('returns alert exactly at interval', () => {
    const now = new Date('2026-06-22T10:20:00.000Z');
    const alerta = calcularAlertaPausa(referencia, now, REGRAS_TERMICA);

    expect(alerta).toMatchObject({
      precisaPausa: true,
      tipoSugerido: 'termica',
      tempoTrabalhoContinuoMinutos: 140,
      intervaloReferenciaMinutos: 140,
      duracaoPausaMinutos: 20,
      atrasoMinutos: 0,
    });
  });

  it('returns alert after interval with delay', () => {
    const now = new Date('2026-06-22T10:50:00.000Z');
    const alerta = calcularAlertaPausa(referencia, now, REGRAS_TERMICA);

    expect(alerta).toMatchObject({
      precisaPausa: true,
      atrasoMinutos: 30,
    });
  });

  it('picks most urgent when multiple rules apply', () => {
    const regras: RegrasPausaPadraoMap = {
      termica: { intervaloTrabalhoMinutos: 140, duracaoPausaMinutos: 20 },
      refeicao: { intervaloTrabalhoMinutos: 360, duracaoPausaMinutos: 75 },
    };
    const now = new Date('2026-06-22T14:30:00.000Z');
    const alerta = calcularAlertaPausa(referencia, now, regras);

    expect(alerta?.tipoSugerido).toBe('termica');
    expect(alerta?.atrasoMinutos).toBeGreaterThan(
      (alerta?.tempoTrabalhoContinuoMinutos ?? 0) - 360,
    );
  });

  it('ignores rules with zero interval', () => {
    const regras: RegrasPausaPadraoMap = {
      outros: { intervaloTrabalhoMinutos: 0, duracaoPausaMinutos: 0 },
    };

    expect(
      calcularAlertaPausa(
        referencia,
        new Date('2026-06-22T12:00:00.000Z'),
        regras,
      ),
    ).toBeNull();
  });
});

describe('calcularProximaPausa', () => {
  const referencia = '2026-06-22T08:00:00.000Z';

  it('returns preview before interval with remaining time', () => {
    const now = new Date('2026-06-22T09:00:00.000Z');
    const proxima = calcularProximaPausa(referencia, now, REGRAS_TERMICA);

    expect(proxima).toMatchObject({
      precisaPausa: false,
      tipoSugerido: 'termica',
      tempoTrabalhoContinuoMinutos: 60,
      intervaloReferenciaMinutos: 140,
      tempoRestanteMinutos: 80,
      atrasoMinutos: 0,
    });
  });

  it('returns overdue preview with zero remaining time', () => {
    const now = new Date('2026-06-22T10:50:00.000Z');
    const proxima = calcularProximaPausa(referencia, now, REGRAS_TERMICA);

    expect(proxima).toMatchObject({
      precisaPausa: true,
      tempoRestanteMinutos: 0,
      atrasoMinutos: 30,
    });
  });

  it('picks soonest upcoming rule when none are overdue', () => {
    const regras: RegrasPausaPadraoMap = {
      termica: { intervaloTrabalhoMinutos: 140, duracaoPausaMinutos: 20 },
      refeicao: { intervaloTrabalhoMinutos: 360, duracaoPausaMinutos: 75 },
    };
    const now = new Date('2026-06-22T09:00:00.000Z');
    const proxima = calcularProximaPausa(referencia, now, regras);

    expect(proxima?.tipoSugerido).toBe('termica');
    expect(proxima?.tempoRestanteMinutos).toBe(80);
  });
});
