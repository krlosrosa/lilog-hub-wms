import { describe, expect, it } from 'vitest';

import {
  calcularFaltaSemFisico,
  resolverDepositoDestinoFisico,
  resolverDepositoPorDivergencia,
  requerQuarentena,
} from '../../src/domain/services/resolver-deposito-divergencia.js';

describe('resolver-deposito-divergencia', () => {
  it('maps shortage divergences to DEB_TRANSP', () => {
    expect(resolverDepositoPorDivergencia('quantidade_menor')).toBe('DEB_TRANSP');
    expect(resolverDepositoPorDivergencia('produto_ausente')).toBe('DEB_TRANSP');
  });

  it('maps attribute divergences to QUARENTENA', () => {
    expect(resolverDepositoPorDivergencia('divergencia_lote')).toBe('QUARENTENA');
    expect(resolverDepositoPorDivergencia('produto_nao_esperado')).toBe(
      'QUARENTENA',
    );
  });

  it('detects quarentena requirement', () => {
    expect(requerQuarentena(['quantidade_maior'])).toBe(false);
    expect(requerQuarentena(['divergencia_peso', 'quantidade_maior'])).toBe(
      true,
    );
  });

  it('routes physical stock to AGUARD_ARM when no quarentena divergences', () => {
    expect(resolverDepositoDestinoFisico(['quantidade_maior'])).toBe(
      'AGUARD_ARM',
    );
  });

  it('calculates shortage without physical stock', () => {
    const falta = calcularFaltaSemFisico([
      {
        tipoDivergencia: 'produto_ausente',
        quantidadeEsperada: 10,
        quantidadeRecebida: 0,
      },
      {
        tipoDivergencia: 'quantidade_menor',
        quantidadeEsperada: 20,
        quantidadeRecebida: 15,
      },
    ]);

    expect(falta).toBe(15);
  });
});
