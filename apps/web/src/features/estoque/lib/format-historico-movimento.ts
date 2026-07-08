import type { HistoricoMovimentacaoItem } from '@/features/estoque/types/estoque-gestao.schema';
import {
  TIPO_MOVIMENTO_LABELS,
} from '@/features/estoque/types/estoque-gestao.schema';
import type { TipoMovimentoEstoque } from '@/features/estoque/types/estoque.api';

export type MovimentoDirecao = 'entrada' | 'saida';

export type AjusteCategoria =
  | 'ajuste_manual'
  | 'bloqueio'
  | 'desbloqueio'
  | 'inventario'
  | 'generico';

export function resolveMovimentoDirecao(
  item: Pick<
    HistoricoMovimentacaoItem,
    | 'tipoMovimento'
    | 'enderecoOrigemId'
    | 'enderecoDestinoId'
    | 'depositoOrigemId'
    | 'depositoDestinoId'
  >,
): MovimentoDirecao | null {
  switch (item.tipoMovimento) {
    case 'ENTRADA':
    case 'ESTORNO':
      return 'entrada';
    case 'SAIDA':
      return 'saida';
    case 'AJUSTE':
      if (item.enderecoDestinoId || item.depositoDestinoId) {
        return 'entrada';
      }

      if (item.enderecoOrigemId || item.depositoOrigemId) {
        return 'saida';
      }

      return null;
    default:
      return null;
  }
}

export function resolveAjusteCategoria(
  item: Pick<HistoricoMovimentacaoItem, 'documentoRef' | 'motivo'>,
): AjusteCategoria {
  const ref = item.documentoRef ?? '';

  if (ref.startsWith('ajuste_saldo:')) {
    return 'ajuste_manual';
  }

  if (ref.startsWith('bloqueio_saldo:')) {
    return 'bloqueio';
  }

  if (ref.startsWith('desbloqueio_saldo:')) {
    return 'desbloqueio';
  }

  if (
    item.motivo === 'inventario_validacao' ||
    ref.includes('inventario')
  ) {
    return 'inventario';
  }

  return 'generico';
}

function resolveDirecaoLabel(direcao: MovimentoDirecao | null): string {
  if (direcao === 'entrada') {
    return 'Acréscimo';
  }

  if (direcao === 'saida') {
    return 'Redução';
  }

  return '';
}

export function formatTituloMovimento(item: HistoricoMovimentacaoItem): string {
  if (item.tipoMovimento !== 'AJUSTE') {
    return TIPO_MOVIMENTO_LABELS[item.tipoMovimento];
  }

  const direcaoLabel = resolveDirecaoLabel(resolveMovimentoDirecao(item));

  switch (resolveAjusteCategoria(item)) {
    case 'ajuste_manual':
      return direcaoLabel
        ? `Ajuste manual — ${direcaoLabel}`
        : 'Ajuste manual';
    case 'bloqueio':
      return 'Bloqueio de saldo';
    case 'desbloqueio':
      return 'Desbloqueio de saldo';
    case 'inventario':
      return direcaoLabel ? `Inventário — ${direcaoLabel}` : 'Inventário';
    default:
      return direcaoLabel
        ? `Ajuste — ${direcaoLabel}`
        : TIPO_MOVIMENTO_LABELS.AJUSTE;
  }
}

export function formatDescricaoMovimento(
  item: HistoricoMovimentacaoItem,
  formatter: Intl.NumberFormat,
): string | null {
  const direcao = resolveMovimentoDirecao(item);
  const quantidade = formatter.format(item.quantidade);
  const unidade = item.unidadeMedida;

  if (item.tipoMovimento === 'AJUSTE') {
    if (direcao === 'entrada') {
      return `Foram adicionadas ${quantidade} ${unidade} nesta posição`;
    }

    if (direcao === 'saida') {
      return `Foram removidas ${quantidade} ${unidade} desta posição`;
    }

    return null;
  }

  if (item.tipoMovimento === 'ENTRADA') {
    return `Entrada de ${quantidade} ${unidade}`;
  }

  if (item.tipoMovimento === 'SAIDA') {
    return `Saída de ${quantidade} ${unidade}`;
  }

  return null;
}

export function formatQuantidadeMovimento(
  item: HistoricoMovimentacaoItem,
  formatter: Intl.NumberFormat,
): {
  prefix: string;
  quantidade: string;
  unidadeMedida: string;
  signed: boolean;
} {
  const quantidade = formatter.format(item.quantidade);
  const direcao = resolveMovimentoDirecao(item);

  if (
    direcao === 'entrada' &&
    (item.tipoMovimento === 'ENTRADA' ||
      item.tipoMovimento === 'AJUSTE' ||
      item.tipoMovimento === 'ESTORNO')
  ) {
    return {
      prefix: '+',
      quantidade,
      unidadeMedida: item.unidadeMedida,
      signed: true,
    };
  }

  if (
    direcao === 'saida' &&
    (item.tipoMovimento === 'SAIDA' || item.tipoMovimento === 'AJUSTE')
  ) {
    return {
      prefix: '-',
      quantidade,
      unidadeMedida: item.unidadeMedida,
      signed: true,
    };
  }

  return {
    prefix: '',
    quantidade,
    unidadeMedida: item.unidadeMedida,
    signed: false,
  };
}

export function quantidadeToneClassName(tipo: TipoMovimentoEstoque): string {
  switch (tipo) {
    case 'ENTRADA':
      return 'text-tertiary';
    case 'SAIDA':
      return 'text-destructive';
    case 'TRANSFERENCIA_DEPOSITO':
      return 'text-primary';
    case 'AJUSTE':
      return 'text-amber-700 dark:text-amber-400';
    default:
      return 'text-foreground';
  }
}

export function quantidadeToneClassNameByDirecao(
  item: HistoricoMovimentacaoItem,
): string {
  const direcao = resolveMovimentoDirecao(item);

  if (direcao === 'entrada') {
    return 'text-tertiary';
  }

  if (direcao === 'saida') {
    return 'text-destructive';
  }

  return quantidadeToneClassName(item.tipoMovimento);
}
