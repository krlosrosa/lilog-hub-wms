import { describe, expect, it } from 'vitest';

import {
  resolverStatusProcessos,
  type MapaProcessoStatusInput,
} from '../../../src/application/services/expedicao/torre-controle/resolver-status-processos.js';

function mapas(
  items: Array<{ processo: MapaProcessoStatusInput['processo']; iniciado?: boolean }>,
): MapaProcessoStatusInput[] {
  return items.map((item) => ({
    processo: item.processo,
    iniciadoEm: item.iniciado ? new Date('2026-06-22T10:00:00.000Z') : null,
  }));
}

describe('resolverStatusProcessos', () => {
  it('mantém processo como pendente quando nenhum mapa foi bipado', () => {
    const status = resolverStatusProcessos(
      'separacao',
      mapas([
        { processo: 'separacao', iniciado: false },
        { processo: 'separacao', iniciado: false },
      ]),
    );

    expect(status.separacao).toBe('pendente');
    expect(status.conferencia).toBe('pendente');
    expect(status.carregamento).toBe('pendente');
  });

  it('marca em_andamento quando ao menos um mapa do processo foi bipado', () => {
    const status = resolverStatusProcessos(
      'separacao',
      mapas([
        { processo: 'separacao', iniciado: true },
        { processo: 'separacao', iniciado: false },
      ]),
    );

    expect(status.separacao).toBe('em_andamento');
  });

  it('marca processo anterior como concluido quando não há mapas pendentes', () => {
    const status = resolverStatusProcessos(
      'conferencia',
      mapas([{ processo: 'conferencia', iniciado: false }]),
      [
        {
          processo: 'separacao',
          iniciadoEm: new Date('2026-06-22T09:00:00.000Z'),
        },
      ],
    );

    expect(status.separacao).toBe('concluido');
    expect(status.conferencia).toBe('pendente');
  });

  it('marca conferencia pendente na etapa atual sem bipagem', () => {
    const status = resolverStatusProcessos(
      'conferencia',
      mapas([
        { processo: 'conferencia', iniciado: false },
        { processo: 'conferencia', iniciado: false },
      ]),
      [
        {
          processo: 'separacao',
          iniciadoEm: new Date('2026-06-22T09:00:00.000Z'),
        },
      ],
    );

    expect(status.separacao).toBe('concluido');
    expect(status.conferencia).toBe('pendente');
    expect(status.carregamento).toBe('pendente');
  });

  it('marca todos concluidos quando transporte finalizado e sem pendências', () => {
    const status = resolverStatusProcessos('finalizado', []);

    expect(status).toEqual({
      separacao: 'concluido',
      conferencia: 'concluido',
      carregamento: 'concluido',
    });
  });

  it('mantém em_andamento quando mapas finalizados saem da fila pendente', () => {
    const status = resolverStatusProcessos(
      'carregamento',
      mapas([{ processo: 'carregamento', iniciado: false }]),
      [
        {
          processo: 'carregamento',
          iniciadoEm: new Date('2026-06-22T10:00:00.000Z'),
        },
      ],
    );

    expect(status.carregamento).toBe('em_andamento');
  });

  it('mantém separacao e conferencia pendentes quando processos foram pulados no teste', () => {
    const status = resolverStatusProcessos(
      'carregamento',
      mapas([{ processo: 'carregamento', iniciado: true }]),
      [
        {
          processo: 'carregamento',
          iniciadoEm: new Date('2026-06-22T10:00:00.000Z'),
        },
      ],
    );

    expect(status.separacao).toBe('pendente');
    expect(status.conferencia).toBe('pendente');
    expect(status.carregamento).toBe('em_andamento');
  });
});
