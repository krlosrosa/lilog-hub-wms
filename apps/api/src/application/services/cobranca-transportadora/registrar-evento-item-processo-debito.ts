import type { DebitoItemStatus } from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';

export type CobrancaEventoItemAcao =
  | 'item_quantidade_alterada'
  | 'item_status_alterado'
  | 'item_observacao_alterada'
  | 'item_valorizado'
  | 'item_valor_alterado'
  | 'item_atualizado'
  | 'item_removido'
  | 'itens_status_alterado_em_massa'
  | 'itens_valorizados_em_massa'
  | 'itens_atualizados_em_massa';

const ITEM_STATUS_LABELS: Record<DebitoItemStatus, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  cobrar: 'Cobrar',
  nao_cobrar: 'Não cobrar',
  sobra: 'Sobra',
};

function formatMoeda(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatQuantidade(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function labelProduto(sku: string | null, descricaoProduto: string | null): string {
  const partes = [sku?.trim(), descricaoProduto?.trim()].filter(Boolean);

  return partes.length > 0 ? partes.join(' — ') : 'Item sem identificação';
}

type MontarEventoItemInput = {
  sku: string | null;
  descricaoProduto: string | null;
  acao: CobrancaEventoItemAcao;
  descricao: string;
};

export function montarEventoItemProcessoDebito(
  input: MontarEventoItemInput,
): { statusNovo: CobrancaEventoItemAcao; descricao: string } {
  return {
    statusNovo: input.acao,
    descricao: `${labelProduto(input.sku, input.descricaoProduto)}\n${input.descricao}`,
  };
}

type AlteracoesItemInput = {
  sku: string | null;
  descricaoProduto: string | null;
  quantidadeAnterior: number | null;
  quantidadeNova: number | null;
  statusAnterior: string | null;
  statusNovo: string | null;
  observacaoAnterior: string | null;
  observacaoNova?: string | null;
  valorUnitarioAnterior: number | null;
  valorUnitarioNovo: number | null;
  valorDebitoAnterior: number | null;
  valorDebitoNovo: number | null;
};

export function montarEventosAlteracaoItem(
  input: AlteracoesItemInput,
): Array<{ statusNovo: CobrancaEventoItemAcao; descricao: string }> {
  const eventos: Array<{ statusNovo: CobrancaEventoItemAcao; descricao: string }> =
    [];

  if (
    input.quantidadeNova != null &&
    input.quantidadeAnterior != null &&
    input.quantidadeNova !== input.quantidadeAnterior
  ) {
    eventos.push(
      montarEventoItemProcessoDebito({
        sku: input.sku,
        descricaoProduto: input.descricaoProduto,
        acao: 'item_quantidade_alterada',
        descricao: `Quantidade: ${formatQuantidade(input.quantidadeAnterior)} → ${formatQuantidade(input.quantidadeNova)}`,
      }),
    );
  }

  if (
    input.statusNovo != null &&
    input.statusAnterior != null &&
    input.statusNovo !== input.statusAnterior
  ) {
    const anterior =
      ITEM_STATUS_LABELS[input.statusAnterior as DebitoItemStatus] ??
      input.statusAnterior;
    const novo =
      ITEM_STATUS_LABELS[input.statusNovo as DebitoItemStatus] ?? input.statusNovo;

    eventos.push(
      montarEventoItemProcessoDebito({
        sku: input.sku,
        descricaoProduto: input.descricaoProduto,
        acao: 'item_status_alterado',
        descricao: `Status: ${anterior} → ${novo}`,
      }),
    );
  }

  if (
    input.observacaoNova !== undefined &&
    (input.observacaoAnterior?.trim() || null) !==
      (input.observacaoNova?.trim() || null)
  ) {
    const anterior = input.observacaoAnterior?.trim() || '—';
    const nova = input.observacaoNova?.trim() || '—';

    eventos.push(
      montarEventoItemProcessoDebito({
        sku: input.sku,
        descricaoProduto: input.descricaoProduto,
        acao: 'item_observacao_alterada',
        descricao: `Observação: ${anterior} → ${nova}`,
      }),
    );
  }

  const valorUnitarioAlterado =
    input.valorUnitarioNovo != null &&
    input.valorUnitarioNovo !== input.valorUnitarioAnterior;
  const valorDebitoAlterado =
    input.valorDebitoNovo != null &&
    input.valorDebitoNovo !== input.valorDebitoAnterior;

  if (valorUnitarioAlterado || valorDebitoAlterado) {
    const acao =
      valorUnitarioAlterado &&
      input.valorUnitarioAnterior == null &&
      input.valorDebitoNovo != null
        ? 'item_valorizado'
        : 'item_valor_alterado';

    const detalhes: string[] = [];

    if (valorUnitarioAlterado && input.valorUnitarioNovo != null) {
      const anterior =
        input.valorUnitarioAnterior != null
          ? `${formatMoeda(input.valorUnitarioAnterior)}/kg`
          : '—';
      detalhes.push(
        `Custo/kg: ${anterior} → ${formatMoeda(input.valorUnitarioNovo)}/kg`,
      );
    }

    if (valorDebitoAlterado && input.valorDebitoNovo != null) {
      const anterior =
        input.valorDebitoAnterior != null
          ? formatMoeda(input.valorDebitoAnterior)
          : '—';
      detalhes.push(
        `Valor débito: ${anterior} → ${formatMoeda(input.valorDebitoNovo)}`,
      );
    }

    eventos.push(
      montarEventoItemProcessoDebito({
        sku: input.sku,
        descricaoProduto: input.descricaoProduto,
        acao,
        descricao: detalhes.join('\n'),
      }),
    );
  }

  if (eventos.length > 1) {
    return [
      montarEventoItemProcessoDebito({
        sku: input.sku,
        descricaoProduto: input.descricaoProduto,
        acao: 'item_atualizado',
        descricao: eventos.map((evento) => evento.descricao.split('\n')[1]).join('\n'),
      }),
    ];
  }

  return eventos;
}

export function montarEventoRemocaoItem(input: {
  sku: string | null;
  descricaoProduto: string | null;
}): { statusNovo: CobrancaEventoItemAcao; descricao: string } {
  return montarEventoItemProcessoDebito({
    sku: input.sku,
    descricaoProduto: input.descricaoProduto,
    acao: 'item_removido',
    descricao: 'Item removido do processo de débito.',
  });
}

type ResumoAlteracaoItemEmMassa = {
  statusNovo: CobrancaEventoItemAcao;
  statusAnterior?: string | null;
  statusDestino?: string | null;
};

export function montarEventoAlteracaoItensEmMassa(input: {
  quantidadeItens: number;
  alteracoes: ResumoAlteracaoItemEmMassa[];
}): { statusNovo: CobrancaEventoItemAcao; descricao: string } | null {
  if (input.quantidadeItens === 0 || input.alteracoes.length === 0) {
    return null;
  }

  const tipos = new Set(input.alteracoes.map((alteracao) => alteracao.statusNovo));

  let acao: CobrancaEventoItemAcao = 'itens_atualizados_em_massa';

  if (tipos.size === 1 && tipos.has('item_status_alterado')) {
    acao = 'itens_status_alterado_em_massa';
  } else if (
    tipos.size <= 2 &&
    [...tipos].every(
      (tipo) => tipo === 'item_valorizado' || tipo === 'item_valor_alterado',
    )
  ) {
    acao = 'itens_valorizados_em_massa';
  }

  const linhas: string[] = [
    `${input.quantidadeItens} item(ns) alterado(s) em lote`,
  ];

  if (acao === 'itens_status_alterado_em_massa') {
    const statusDestino = input.alteracoes.find(
      (alteracao) => alteracao.statusDestino,
    )?.statusDestino;

    if (statusDestino) {
      const label =
        ITEM_STATUS_LABELS[statusDestino as DebitoItemStatus] ?? statusDestino;
      linhas.push(`Novo status: ${label}`);
    }
  }

  return {
    statusNovo: acao,
    descricao: linhas.join('\n'),
  };
}
