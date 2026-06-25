import { describe, expect, it } from 'vitest';

import {
  resolverHorariosProcessos,
  type MapaGrupoHorarioInput,
} from '../../../src/application/services/expedicao/torre-controle/resolver-horarios-processos.js';

function mapas(
  items: Array<{
    processo: MapaGrupoHorarioInput['processo'];
    iniciado?: string;
    finalizado?: string;
  }>,
): MapaGrupoHorarioInput[] {
  return items.map((item, index) => ({
    transporteId: 'transporte-1',
    processo: item.processo,
    iniciadoEm: item.iniciado ? new Date(item.iniciado) : null,
    finalizadoEm: item.finalizado ? new Date(item.finalizado) : null,
  }));
}

describe('resolverHorariosProcessos', () => {
  it('retorna horários nulos quando nenhum mapa foi iniciado', () => {
    const horarios = resolverHorariosProcessos(
      mapas([
        { processo: 'separacao' },
        { processo: 'separacao' },
      ]),
    );

    expect(horarios.separacao).toEqual({ inicio: null, fim: null });
  });

  it('calcula início e fim quando todos os mapas do processo finalizaram', () => {
    const horarios = resolverHorariosProcessos(
      mapas([
        {
          processo: 'separacao',
          iniciado: '2026-06-22T19:10:00.000Z',
          finalizado: '2026-06-22T19:40:00.000Z',
        },
        {
          processo: 'separacao',
          iniciado: '2026-06-22T19:15:00.000Z',
          finalizado: '2026-06-22T19:45:00.000Z',
        },
      ]),
    );

    expect(horarios.separacao.inicio).toMatch(/\d{2}:\d{2}/);
    expect(horarios.separacao.fim).toMatch(/\d{2}:\d{2}/);
  });

  it('mantém fim nulo enquanto existir mapa em andamento', () => {
    const horarios = resolverHorariosProcessos(
      mapas([
        {
          processo: 'conferencia',
          iniciado: '2026-06-22T20:00:00.000Z',
          finalizado: '2026-06-22T20:30:00.000Z',
        },
        {
          processo: 'conferencia',
          iniciado: '2026-06-22T20:05:00.000Z',
        },
      ]),
    );

    expect(horarios.conferencia.inicio).not.toBeNull();
    expect(horarios.conferencia.fim).toBeNull();
  });
});
