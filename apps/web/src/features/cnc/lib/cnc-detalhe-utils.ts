import type {
  CncDetalhe,
  CncItem,
  CncSubtipoOcorrencia,
} from '@/features/cnc/types/cnc.schema';

export function formatCncDate(iso: string | null) {
  if (!iso) {
    return '—';
  }

  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCncCurrency(value: number | null) {
  if (value === null) {
    return '—';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatCncQuantidade(value: number | null, unidade: string | null) {
  if (value === null) {
    return '—';
  }

  const formatted = value.toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  });

  return unidade ? `${formatted} ${unidade}` : formatted;
}

export function calcularResumoAnomalias(itens: CncItem[]) {
  const divergencias = itens.filter((item) => item.tipo === 'divergencia').length;
  const avarias = itens.filter((item) => item.tipo === 'avaria').length;

  return {
    total: itens.length,
    divergencias,
    avarias,
  };
}

export function calcularProgressoTratativas(cnc: CncDetalhe) {
  const total = cnc.tratativas.length;
  const concluidas = cnc.tratativas.filter(
    (tratativa) => tratativa.status === 'concluida',
  ).length;
  const pendentes = cnc.tratativas.filter(
    (tratativa) => tratativa.status === 'pendente',
  ).length;

  return {
    total,
    concluidas,
    pendentes,
    percentual: total > 0 ? Math.round((concluidas / total) * 100) : 0,
  };
}

export const SUBTIPO_CONFIG: Record<
  CncSubtipoOcorrencia,
  { accent: string; border: string; bg: string }
> = {
  falta: {
    accent: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  sobra: {
    accent: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
  },
  avaria: {
    accent: 'text-destructive',
    border: 'border-destructive/30',
    bg: 'bg-destructive/10',
  },
  lote_divergente: {
    accent: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
  },
  peso_divergente: {
    accent: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
  },
  validade_divergente: {
    accent: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
  },
  produto_nao_previsto: {
    accent: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-500/30',
    bg: 'bg-fuchsia-500/10',
  },
};

export function getAnaliseSugerida(item: CncItem): string | null {
  switch (item.subtipoOcorrencia) {
    case 'falta':
      return 'Verifique se a falta ocorreu no transporte ou na separação do fornecedor. Cruze com a NF e o romaneio.';
    case 'sobra':
      return 'Confirme se a sobra pertence ao mesmo pedido ou se houve mistura de cargas no recebimento.';
    case 'avaria':
      return 'Documente a natureza e causa da avaria. Avalie responsabilidade entre transportadora, fornecedor e operação.';
    case 'lote_divergente':
      return 'Compare lote esperado e recebido. Verifique rastreabilidade e restrições de shelf life do produto.';
    case 'peso_divergente':
      return 'Recalcule o peso por unidade e confira se houve erro de pesagem ou embalagem incompleta.';
    case 'validade_divergente':
      return 'Avalie se a validade recebida atende ao mínimo contratual e se há impacto na expedição.';
    case 'produto_nao_previsto':
      return 'Identifique a origem do item não previsto e se deve ser devolvido, segregado ou incluído no pedido.';
    default:
      return item.tipo === 'avaria'
        ? 'Analise fotos e descrição da avaria para definir responsável e tratativa imediata.'
        : null;
  }
}
