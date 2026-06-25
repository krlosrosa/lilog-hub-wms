import { describe, expect, it } from 'vitest';

import type { ItemAguardandoArmazenagemGroup } from '../../src/domain/services/build-itens-aguardando-armazenagem.js';
import { mergeItensAguardandoComDistribuicaoReal } from '../../src/domain/services/merge-itens-aguardando-distribuicao.js';

describe('mergeItensAguardandoComDistribuicaoReal', () => {
  const itemBase: ItemAguardandoArmazenagemGroup = {
    unitizadorId: null,
    produtoId: 'prod-1',
    quantidade: 600,
    unidadeMedida: 'UN',
    lote: '10001',
    validade: null,
    numeroSerie: null,
  };

  it('alinha quantidade do item ao saldo efetivamente transferido', () => {
    const result = mergeItensAguardandoComDistribuicaoReal([itemBase], [
      {
        produtoId: 'prod-1',
        quantidade: 480,
        lote: '10001',
        numeroSerie: '',
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.quantidade).toBe(480);
  });

  it('remove item quando nada foi transferido para AGUARD_ARM', () => {
    const result = mergeItensAguardandoComDistribuicaoReal([itemBase], []);

    expect(result).toHaveLength(0);
  });

  it('usa saldo agregado por produto quando lote e série do item estão vazios', () => {
    const result = mergeItensAguardandoComDistribuicaoReal(
      [{ ...itemBase, lote: null, quantidade: 48 }],
      [
        { produtoId: 'prod-1', quantidade: 12, lote: 'A', numeroSerie: '' },
        { produtoId: 'prod-1', quantidade: 24, lote: 'B', numeroSerie: '' },
      ],
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.quantidade).toBe(36);
  });
});
