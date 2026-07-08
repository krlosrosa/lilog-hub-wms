import { describe, expect, it } from 'vitest';

import { buildTarefasFromItensBipados } from '../../../src/domain/services/build-tarefas-armazenagem-bipadas.js';
import type { ItemAguardandoArmazenagem } from '../../../src/domain/services/build-itens-aguardando-armazenagem.js';

describe('buildTarefasFromItensBipados', () => {
  const baseItem = (
    overrides: Partial<ItemAguardandoArmazenagem>,
  ): ItemAguardandoArmazenagem => ({
    unitizadorId: null,
    produtoId: 'PROD-1',
    quantidade: 10,
    unidadeMedida: 'UN',
    lote: null,
    validade: null,
    numeroSerie: null,
    ...overrides,
  });

  it('groups items by unitizadorId into tarefas with sequential numbers', () => {
    const unitizadorA = '00000000-0000-4000-8000-000000000001';
    const unitizadorB = '00000000-0000-4000-8000-000000000002';

    const result = buildTarefasFromItensBipados([
      baseItem({ unitizadorId: unitizadorA, produtoId: 'PROD-1', quantidade: 5 }),
      baseItem({ unitizadorId: unitizadorA, produtoId: 'PROD-2', quantidade: 3 }),
      baseItem({ unitizadorId: unitizadorB, produtoId: 'PROD-1', quantidade: 7 }),
    ]);

    expect(result.itensSemUnitizador).toEqual([]);
    expect(result.tarefas).toHaveLength(2);
    expect(result.tarefas[0]).toMatchObject({
      unitizadorId: unitizadorA,
      sequencia: 1,
      itens: [
        expect.objectContaining({ produtoId: 'PROD-1', quantidade: 5 }),
        expect.objectContaining({ produtoId: 'PROD-2', quantidade: 3 }),
      ],
    });
    expect(result.tarefas[1]).toMatchObject({
      unitizadorId: unitizadorB,
      sequencia: 2,
      itens: [expect.objectContaining({ produtoId: 'PROD-1', quantidade: 7 })],
    });
  });

  it('returns items without unitizadorId as fallback list', () => {
    const unitizadorId = '00000000-0000-4000-8000-000000000003';

    const result = buildTarefasFromItensBipados([
      baseItem({ unitizadorId, quantidade: 4 }),
      baseItem({ unitizadorId: null, produtoId: 'PROD-9', quantidade: 2 }),
    ]);

    expect(result.tarefas).toHaveLength(1);
    expect(result.tarefas[0]?.unitizadorId).toBe(unitizadorId);
    expect(result.itensSemUnitizador).toEqual([
      expect.objectContaining({ produtoId: 'PROD-9', quantidade: 2 }),
    ]);
  });

  it('returns empty tarefas when all items lack unitizadorId', () => {
    const result = buildTarefasFromItensBipados([
      baseItem({ unitizadorId: null }),
    ]);

    expect(result.tarefas).toEqual([]);
    expect(result.itensSemUnitizador).toHaveLength(1);
  });
});
