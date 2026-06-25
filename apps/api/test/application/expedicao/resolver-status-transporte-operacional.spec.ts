import { describe, expect, it } from 'vitest';

import {
  resolverStatusTransporteOperacional,
  type ResumoGruposOperacionaisRecord,
} from '../../../src/application/services/expedicao/resolver-status-transporte-operacional.js';

function resumo(
  overrides: Partial<ResumoGruposOperacionaisRecord> = {},
): ResumoGruposOperacionaisRecord {
  const empty = { total: 0, iniciados: 0, finalizados: 0 };

  return {
    separacao: { ...empty, ...overrides.separacao },
    conferencia: { ...empty, ...overrides.conferencia },
    carregamento: { ...empty, ...overrides.carregamento },
  };
}

describe('resolverStatusTransporteOperacional', () => {
  it('mantém status pré-operacional quando nenhum grupo foi iniciado', () => {
    expect(
      resolverStatusTransporteOperacional(resumo(), 'pendente'),
    ).toBe('pendente');
    expect(
      resolverStatusTransporteOperacional(resumo(), 'alocado'),
    ).toBe('alocado');
    expect(
      resolverStatusTransporteOperacional(resumo(), 'parcial'),
    ).toBe('parcial');
  });

  it('marca em_separacao quando ao menos um grupo de separação foi iniciado', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 3, iniciados: 1, finalizados: 0 },
      }),
      'alocado',
    );

    expect(status).toBe('em_separacao');
  });

  it('marca separado quando todos os grupos de separação foram finalizados', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 2, iniciados: 2, finalizados: 2 },
      }),
      'em_separacao',
    );

    expect(status).toBe('separado');
  });

  it('marca em_conferencia quando conferência iniciou e ainda há pendências', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 1, iniciados: 1, finalizados: 1 },
        conferencia: { total: 2, iniciados: 1, finalizados: 0 },
      }),
      'separado',
    );

    expect(status).toBe('em_conferencia');
  });

  it('marca conferido quando todos os grupos de conferência foram finalizados', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 1, iniciados: 1, finalizados: 1 },
        conferencia: { total: 2, iniciados: 2, finalizados: 2 },
      }),
      'em_conferencia',
    );

    expect(status).toBe('conferido');
  });

  it('marca em_carregamento quando carregamento iniciou e ainda há pendências', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 1, iniciados: 1, finalizados: 1 },
        conferencia: { total: 1, iniciados: 1, finalizados: 1 },
        carregamento: { total: 3, iniciados: 1, finalizados: 0 },
      }),
      'conferido',
    );

    expect(status).toBe('em_carregamento');
  });

  it('marca carregado quando todos os grupos de carregamento foram finalizados', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 1, iniciados: 1, finalizados: 1 },
        conferencia: { total: 1, iniciados: 1, finalizados: 1 },
        carregamento: { total: 2, iniciados: 2, finalizados: 2 },
      }),
      'em_carregamento',
    );

    expect(status).toBe('carregado');
  });

  it('prioriza carregamento sobre conferência e separação', () => {
    const status = resolverStatusTransporteOperacional(
      resumo({
        separacao: { total: 1, iniciados: 1, finalizados: 1 },
        conferencia: { total: 1, iniciados: 1, finalizados: 1 },
        carregamento: { total: 2, iniciados: 1, finalizados: 0 },
      }),
      'conferido',
    );

    expect(status).toBe('em_carregamento');
  });

  it('mantém em_viagem e viagem_finalizada sem recalcular pelo WMS', () => {
    const resumoCompleto = resumo({
      separacao: { total: 1, iniciados: 1, finalizados: 1 },
      conferencia: { total: 1, iniciados: 1, finalizados: 1 },
      carregamento: { total: 1, iniciados: 1, finalizados: 1 },
    });

    expect(
      resolverStatusTransporteOperacional(resumoCompleto, 'em_viagem'),
    ).toBe('em_viagem');
    expect(
      resolverStatusTransporteOperacional(resumoCompleto, 'viagem_finalizada'),
    ).toBe('viagem_finalizada');
  });
});
