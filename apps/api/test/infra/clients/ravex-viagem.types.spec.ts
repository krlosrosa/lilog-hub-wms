import { describe, expect, it } from 'vitest';

import { resolverPlacaViagemRavex } from '../../../src/application/services/devolucao/resolver-placa-viagem-ravex.js';
import {
  RavexAnomaliaViagemListEnvelopeSchema,
  RavexNotaFiscalItemListEnvelopeSchema,
  RavexViagemFaturadaEnvelopeSchema,
} from '../../../src/infra/clients/ravex/ravex-viagem.types.js';

describe('RavexAnomaliaViagemListEnvelopeSchema', () => {
  it('aceita números como string no payload da Ravex', () => {
    const parsed = RavexAnomaliaViagemListEnvelopeSchema.safeParse({
      success: true,
      data: [
        {
          anomaliaId: '11945224',
          tipoRetorno: '2',
          notaFiscalId: '338148992',
          numeroNotaFiscal: 12345,
          devolucaoContabil: 'true',
          item: {
            codigo: 'SKU-001',
            itemId: '10',
            quantidadeDevolvida: '3',
          },
        },
      ],
      errors: [],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data.data?.[0]).toMatchObject({
      anomaliaId: 11945224,
      tipoRetorno: 2,
      notaFiscalId: 338148992,
      numeroNotaFiscal: '12345',
      devolucaoContabil: true,
      item: {
        codigo: 'SKU-001',
        itemId: 10,
        quantidadeDevolvida: 3,
      },
    });
  });

  it('aceita lista vazia de anomalias', () => {
    const parsed = RavexAnomaliaViagemListEnvelopeSchema.safeParse({
      success: true,
      data: [],
      errors: [],
    });

    expect(parsed.success).toBe(true);
  });
});

describe('RavexViagemFaturadaEnvelopeSchema', () => {
  it('aceita veiculo.placa no payload da viagem', () => {
    const parsed = RavexViagemFaturadaEnvelopeSchema.safeParse({
      success: true,
      data: {
        id: 19380977,
        identificador: 'T-001',
        veiculo: {
          placa: 'abc-1234',
        },
      },
      errors: [],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data.data).toMatchObject({
      id: 19380977,
      veiculo: {
        placa: 'abc-1234',
      },
    });

    expect(resolverPlacaViagemRavex(parsed.data.data!)).toBe('ABC-1234');
  });

  it('retorna null quando viagem não traz placa', () => {
    const parsed = RavexViagemFaturadaEnvelopeSchema.safeParse({
      success: true,
      data: {
        id: 19380977,
      },
      errors: [],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(resolverPlacaViagemRavex(parsed.data.data!)).toBeNull();
  });
});

describe('RavexNotaFiscalItemListEnvelopeSchema', () => {
  it('aceita números como string nos itens da NF', () => {
    const parsed = RavexNotaFiscalItemListEnvelopeSchema.safeParse({
      success: true,
      data: [
        {
          id: '10',
          sequencia: '1',
          referenciaItem: 'SKU-001',
          descricaoItem: 'Produto A',
          unidade: 'CX',
          quantidade: '12',
          produto: {
            id: '99',
            codigo: 'SKU-001',
            unidade: 'CX',
          },
        },
      ],
      errors: [],
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    expect(parsed.data.data?.[0]).toMatchObject({
      id: 10,
      sequencia: 1,
      quantidade: 12,
      produto: {
        id: 99,
        codigo: 'SKU-001',
      },
    });
  });
});
