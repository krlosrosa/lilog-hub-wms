import { describe, expect, it } from 'vitest';

import {
  montarEventosAlteracaoItem,
  montarEventoRemocaoItem,
  montarEventoAlteracaoItensEmMassa,
} from '../../../src/application/services/cobranca-transportadora/registrar-evento-item-processo-debito.js';

describe('registrar-evento-item-processo-debito', () => {
  it('monta evento de alteração de status', () => {
    const [evento] = montarEventosAlteracaoItem({
      sku: '540300492',
      descricaoProduto: 'Creatina',
      quantidadeAnterior: 10,
      quantidadeNova: null,
      statusAnterior: 'cobrar',
      statusNovo: 'nao_cobrar',
      observacaoAnterior: null,
      observacaoNova: undefined,
      valorUnitarioAnterior: null,
      valorUnitarioNovo: null,
      valorDebitoAnterior: 0,
      valorDebitoNovo: null,
    });

    expect(evento?.statusNovo).toBe('item_status_alterado');
    expect(evento?.descricao).toContain('540300492');
    expect(evento?.descricao).toContain('Não cobrar');
  });

  it('consolida múltiplas alterações em um único evento', () => {
    const [evento] = montarEventosAlteracaoItem({
      sku: '540300492',
      descricaoProduto: 'Creatina',
      quantidadeAnterior: 10,
      quantidadeNova: 12,
      statusAnterior: 'cobrar',
      statusNovo: 'nao_cobrar',
      observacaoAnterior: null,
      observacaoNova: undefined,
      valorUnitarioAnterior: null,
      valorUnitarioNovo: null,
      valorDebitoAnterior: 100,
      valorDebitoNovo: 120,
    });

    expect(evento?.statusNovo).toBe('item_atualizado');
    expect(evento?.descricao).toContain('Quantidade:');
    expect(evento?.descricao).toContain('Status:');
    expect(evento?.descricao).toContain('Valor débito:');
  });

  it('monta evento de remoção', () => {
    const evento = montarEventoRemocaoItem({
      sku: '540300492',
      descricaoProduto: 'Creatina',
    });

    expect(evento.statusNovo).toBe('item_removido');
    expect(evento.descricao).toContain('Item removido');
  });

  it('monta evento de alteração de status em massa', () => {
    const evento = montarEventoAlteracaoItensEmMassa({
      quantidadeItens: 5,
      alteracoes: [
        { statusNovo: 'item_status_alterado', statusDestino: 'nao_cobrar' },
        { statusNovo: 'item_status_alterado', statusDestino: 'nao_cobrar' },
      ],
    });

    expect(evento?.statusNovo).toBe('itens_status_alterado_em_massa');
    expect(evento?.descricao).toContain('5 item(ns)');
    expect(evento?.descricao).toContain('Não cobrar');
  });

  it('monta evento de valorização em massa', () => {
    const evento = montarEventoAlteracaoItensEmMassa({
      quantidadeItens: 3,
      alteracoes: [
        { statusNovo: 'item_valorizado' },
        { statusNovo: 'item_valor_alterado' },
      ],
    });

    expect(evento?.statusNovo).toBe('itens_valorizados_em_massa');
    expect(evento?.descricao).toContain('3 item(ns)');
  });
});
