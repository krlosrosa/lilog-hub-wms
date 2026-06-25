import { describe, expect, it } from 'vitest';

import {
  contemInstante,
  DEFAULT_TIMEZONE,
  duracaoMinutos,
  inferCruzaMeiaNoite,
  resolveJanelaPlanejada,
  validarHorariosEscala,
} from '../../../src/domain/services/sessao-operacao/janela-turno.js';

describe('inferCruzaMeiaNoite', () => {
  it('retorna true para turno noturno 22:00–06:00', () => {
    expect(inferCruzaMeiaNoite('22:00', '06:00')).toBe(true);
  });

  it('retorna false para turno diurno 06:00–14:00', () => {
    expect(inferCruzaMeiaNoite('06:00', '14:00')).toBe(false);
  });
});

describe('validarHorariosEscala', () => {
  it('rejeita horário de início igual ao fim', () => {
    expect(() => validarHorariosEscala('08:00', '08:00')).toThrow(
      'Hora de início e fim não podem ser iguais',
    );
  });
});

describe('resolveJanelaPlanejada', () => {
  it('resolve turno diurno no mesmo dia', () => {
    const janela = resolveJanelaPlanejada({
      dataReferencia: '2026-06-20',
      horaInicio: '06:00',
      horaFim: '14:00',
      cruzaMeiaNoite: false,
    });

    expect(janela.inicioPlanejado.toISOString()).toBe('2026-06-20T09:00:00.000Z');
    expect(janela.fimPlanejado.toISOString()).toBe('2026-06-20T17:00:00.000Z');
    expect(duracaoMinutos({
      inicio: janela.inicioPlanejado,
      fim: janela.fimPlanejado,
    })).toBe(480);
  });

  it('resolve turno noturno com fim no dia seguinte', () => {
    const janela = resolveJanelaPlanejada({
      dataReferencia: '2026-06-20',
      horaInicio: '22:00',
      horaFim: '06:00',
      cruzaMeiaNoite: true,
    });

    expect(janela.inicioPlanejado.toISOString()).toBe('2026-06-21T01:00:00.000Z');
    expect(janela.fimPlanejado.toISOString()).toBe('2026-06-21T09:00:00.000Z');
  });

  it('mantém data_referencia como dia de início em sexta→sábado', () => {
    const janela = resolveJanelaPlanejada({
      dataReferencia: '2026-06-19',
      horaInicio: '22:00',
      horaFim: '06:00',
      cruzaMeiaNoite: true,
    });

    expect(janela.inicioPlanejado.toISOString()).toBe('2026-06-20T01:00:00.000Z');
    expect(janela.fimPlanejado.toISOString()).toBe('2026-06-20T09:00:00.000Z');
  });

  it('rejeita flag cruzaMeiaNoite inconsistente', () => {
    expect(() =>
      resolveJanelaPlanejada({
        dataReferencia: '2026-06-20',
        horaInicio: '06:00',
        horaFim: '14:00',
        cruzaMeiaNoite: true,
      }),
    ).toThrow('Flag cruzaMeiaNoite inconsistente com os horários informados');
  });

  it('usa timezone America/Fortaleza por padrão', () => {
    const janela = resolveJanelaPlanejada({
      dataReferencia: '2026-06-20',
      horaInicio: '06:00',
      horaFim: '14:00',
      cruzaMeiaNoite: false,
      timezone: DEFAULT_TIMEZONE,
    });

    expect(janela.inicioPlanejado.toISOString()).toBe('2026-06-20T09:00:00.000Z');
  });
});

describe('contemInstante', () => {
  it('considera meia-noite dentro de turno noturno', () => {
    const janela = resolveJanelaPlanejada({
      dataReferencia: '2026-06-20',
      horaInicio: '22:00',
      horaFim: '06:00',
      cruzaMeiaNoite: true,
    });

    const meiaNoite = new Date('2026-06-21T03:00:00.000Z');
    expect(
      contemInstante(
        {
          inicio: janela.inicioPlanejado,
          fim: janela.fimPlanejado,
        },
        meiaNoite,
      ),
    ).toBe(true);
  });

  it('retorna false fora da janela', () => {
    const janela = resolveJanelaPlanejada({
      dataReferencia: '2026-06-20',
      horaInicio: '06:00',
      horaFim: '14:00',
      cruzaMeiaNoite: false,
    });

    expect(
      contemInstante(
        {
          inicio: janela.inicioPlanejado,
          fim: janela.fimPlanejado,
        },
        new Date('2026-06-20T20:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
