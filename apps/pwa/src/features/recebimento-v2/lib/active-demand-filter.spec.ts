import { describe, expect, it } from 'vitest';

import { isActiveDemandProcess } from './active-demand-filter';
import type { DemandRecord, ProcessRecord } from '../local-db/schema';

function makeProcess(status: ProcessRecord['status']): ProcessRecord {
  return {
    id: 'demand-1',
    unidadeId: 'ITB',
    adapter: 'recebimento-v2',
    status,
    serverRevision: 0,
    baseRevision: 0,
    flowVersion: 'v2',
    createdAt: 1,
    updatedAt: 1,
  };
}

function makeDemand(situacao: string): DemandRecord {
  return {
    id: 'demand-1',
    unidadeId: 'ITB',
    routeId: 'demand-1',
    fornecedorCodigo: '',
    fornecedorNome: '',
    status: situacao,
    situacao,
    dataPrevisaoEntrega: '',
    dataCriacao: '',
    serverRevision: 0,
    updatedAt: 1,
  };
}

describe('isActiveDemandProcess', () => {
  it('hides completed processes', () => {
    expect(isActiveDemandProcess(makeProcess('completed'), makeDemand('conferido'))).toBe(false);
  });

  it('shows active situacoes from demand record', () => {
    expect(
      isActiveDemandProcess(makeProcess('ready'), makeDemand('liberado_para_conferencia')),
    ).toBe(true);
    expect(isActiveDemandProcess(makeProcess('working'), makeDemand('em_conferencia'))).toBe(
      true,
    );
    expect(isActiveDemandProcess(makeProcess('pendingSync'), makeDemand('impedido'))).toBe(
      true,
    );
  });

  it('hides finished situacoes', () => {
    expect(isActiveDemandProcess(makeProcess('ready'), makeDemand('conferido'))).toBe(false);
    expect(isActiveDemandProcess(makeProcess('ready'), makeDemand('finalizado'))).toBe(false);
  });
});
