import { describe, expect, it } from 'vitest';

import {
  formatDescricaoMovimento,
  formatQuantidadeMovimento,
  formatTituloMovimento,
  resolveMovimentoDirecao,
} from '@/features/estoque/lib/format-historico-movimento';
import type { HistoricoMovimentacaoItem } from '@/features/estoque/types/estoque-gestao.schema';

const nf = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

function buildItem(
  overrides: Partial<HistoricoMovimentacaoItem> = {},
): HistoricoMovimentacaoItem {
  return {
    id: '1',
    tipoMovimento: 'AJUSTE',
    quantidade: 11,
    unidadeMedida: 'UN',
    lote: 'L001',
    validade: null,
    numeroSerie: '',
    natureza: 'fisico',
    documentoRef: 'ajuste_saldo:abc:123',
    motivo: 'Contagem cíclica',
    operatorId: 1,
    operatorNome: 'Operador',
    occurredAt: '2026-07-06T12:00:00.000Z',
    depositoOrigemId: 'dep-1',
    depositoOrigemCodigo: 'DEP01',
    depositoOrigemNome: 'Depósito 1',
    depositoDestinoId: null,
    depositoDestinoCodigo: null,
    depositoDestinoNome: null,
    enderecoOrigemId: 'end-1',
    enderecoOrigemMascarado: 'A-01-01',
    enderecoDestinoId: null,
    enderecoDestinoMascarado: null,
    ...overrides,
  };
}

describe('format-historico-movimento', () => {
  it('identifica redução em ajuste manual', () => {
    const item = buildItem();

    expect(resolveMovimentoDirecao(item)).toBe('saida');
    expect(formatTituloMovimento(item)).toBe('Ajuste manual — Redução');
    expect(formatDescricaoMovimento(item, nf)).toBe(
      'Foram removidas 11 UN desta posição',
    );
    expect(formatQuantidadeMovimento(item, nf)).toEqual({
      prefix: '-',
      quantidade: '11',
      unidadeMedida: 'UN',
      signed: true,
    });
  });

  it('identifica acréscimo em ajuste manual', () => {
    const item = buildItem({
      depositoOrigemId: null,
      depositoOrigemCodigo: null,
      depositoOrigemNome: null,
      enderecoOrigemId: null,
      enderecoOrigemMascarado: null,
      depositoDestinoId: 'dep-1',
      depositoDestinoCodigo: 'DEP01',
      depositoDestinoNome: 'Depósito 1',
      enderecoDestinoId: 'end-1',
      enderecoDestinoMascarado: 'A-01-01',
    });

    expect(resolveMovimentoDirecao(item)).toBe('entrada');
    expect(formatTituloMovimento(item)).toBe('Ajuste manual — Acréscimo');
    expect(formatDescricaoMovimento(item, nf)).toBe(
      'Foram adicionadas 11 UN nesta posição',
    );
    expect(formatQuantidadeMovimento(item, nf).prefix).toBe('+');
  });

  it('identifica bloqueio de saldo', () => {
    const item = buildItem({
      documentoRef: 'bloqueio_saldo:abc:123',
      motivo: 'AVARIA',
    });

    expect(formatTituloMovimento(item)).toBe('Bloqueio de saldo');
  });
});
