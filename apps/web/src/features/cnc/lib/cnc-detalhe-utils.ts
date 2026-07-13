import type {
  CncDetalhe,
  CncEvento,
  CncItem,
  CncSubtipoOcorrencia,
} from '@/features/cnc/types/cnc.schema';
import type { DisplayConfig } from '@/lib/format-quantidade';
import { formatQuantidadeValue, resolveCasasDecimais } from '@/lib/format-quantidade';

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

export function formatCncQuantidade(
  value: number | null,
  unidade: string | null,
  config?: DisplayConfig,
) {
  if (config) {
    return formatQuantidadeValue(value, unidade, config);
  }

  if (value === null) {
    return '—';
  }

  const formatted = value.toLocaleString('pt-BR', {
    maximumFractionDigits: 3,
  });

  return unidade ? `${formatted} ${unidade}` : formatted;
}

export function formatCncQuantidadeNumber(
  value: number | null,
  unidade: string | null,
  config?: DisplayConfig,
): string {
  if (value === null) {
    return '—';
  }

  const casasDecimais = config
    ? resolveCasasDecimais(unidade, config)
    : 3;

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

export function formatCncPesoKg(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} Kg`;
}

export function isPesoDivergenteItem(item: CncItem): boolean {
  return item.subtipoOcorrencia === 'peso_divergente';
}

export function filtrarEventosDoItem(eventos: CncEvento[], itemId: string) {
  return eventos.filter((evento) => {
    const metadataItemId = evento.metadata.itemId;

    return (
      typeof metadataItemId === 'string' && metadataItemId === itemId
    );
  });
}

type ItemValoresSnapshot = {
  quantidadeEsperada?: number | null;
  quantidadeRecebida?: number | null;
  quantidadeDivergente?: number | null;
  pesoEsperado?: number | null;
  pesoRecebido?: number | null;
  subtipoOcorrencia?: CncSubtipoOcorrencia | null;
  sku?: string | null;
  descricaoProduto?: string | null;
  unidadeMedida?: string | null;
};

function asItemValoresSnapshot(value: unknown): ItemValoresSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as ItemValoresSnapshot;
}

function formatValorHistoricoItem(
  value: number | null | undefined,
  opts: { isPeso: boolean; unidade?: string | null },
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (opts.isPeso) {
    return formatCncPesoKg(value);
  }

  return formatCncQuantidade(value, opts.unidade ?? null);
}

function descreverAlteracaoCampo(
  label: string,
  before: number | null | undefined,
  after: number | null | undefined,
  opts: { isPeso: boolean; unidade?: string | null },
): string | null {
  const beforeVal = before ?? null;
  const afterVal = after ?? null;

  if (beforeVal === afterVal) {
    return null;
  }

  const beforeFmt = formatValorHistoricoItem(beforeVal, opts);
  const afterFmt = formatValorHistoricoItem(afterVal, opts);

  if (beforeVal === null && afterVal !== null) {
    return `${label} definido como ${afterFmt}`;
  }

  if (beforeVal !== null && afterVal === null) {
    return `${label} removido (era ${beforeFmt})`;
  }

  if (beforeVal !== null && afterVal !== null) {
    if (afterVal > beforeVal) {
      return `${label} aumentou de ${beforeFmt} para ${afterFmt}`;
    }

    if (afterVal < beforeVal) {
      return `${label} reduziu de ${beforeFmt} para ${afterFmt}`;
    }
  }

  return `${label}: ${beforeFmt} → ${afterFmt}`;
}

export type ContextoEventoItem = {
  subtipoOcorrencia?: CncSubtipoOcorrencia | null;
  unidadeMedida?: string | null;
};

export function resolverContextoEventoItem(
  evento: CncEvento,
  itens: CncItem[],
): ContextoEventoItem {
  const itemId = evento.metadata.itemId;

  if (typeof itemId === 'string') {
    const item = itens.find((entry) => entry.id === itemId);

    if (item) {
      return {
        subtipoOcorrencia: item.subtipoOcorrencia,
        unidadeMedida: item.unidadeMedida,
      };
    }
  }

  const subtipoMetadata = evento.metadata.subtipoOcorrencia;
  const unidadeMetadata = evento.metadata.unidadeMedida;

  if (
    typeof subtipoMetadata === 'string' ||
    subtipoMetadata === null
  ) {
    return {
      subtipoOcorrencia: subtipoMetadata as CncSubtipoOcorrencia | null,
      unidadeMedida:
        typeof unidadeMetadata === 'string' ? unidadeMetadata : null,
    };
  }

  const snapshot = asItemValoresSnapshot(evento.metadata.itemSnapshot);

  if (snapshot) {
    return {
      subtipoOcorrencia: snapshot.subtipoOcorrencia ?? null,
      unidadeMedida: snapshot.unidadeMedida ?? null,
    };
  }

  return {};
}

export function formatarDetalhesEventoItem(
  evento: CncEvento,
  context: ContextoEventoItem = {},
): string[] {
  const isPeso = context.subtipoOcorrencia === 'peso_divergente';
  const quantidadeOpts = { isPeso: false, unidade: context.unidadeMedida };
  const pesoOpts = { isPeso: true, unidade: null };

  if (evento.tipoEvento === 'ITEM_ATUALIZADO') {
    const before = asItemValoresSnapshot(evento.metadata.before);
    const after = asItemValoresSnapshot(evento.metadata.after);

    if (!before || !after) {
      return [];
    }

    const alteracoes: string[] = [];

    if (isPeso) {
      const camposPeso = [
        ['Peso esperado', 'pesoEsperado', pesoOpts],
        ['Peso recebido', 'pesoRecebido', pesoOpts],
        ['Divergência de peso', 'quantidadeDivergente', pesoOpts],
      ] as const;

      for (const [label, key, opts] of camposPeso) {
        const linha = descreverAlteracaoCampo(
          label,
          before[key],
          after[key],
          opts,
        );

        if (linha) {
          alteracoes.push(linha);
        }
      }
    } else {
      const camposQuantidade = [
        ['Quantidade esperada', 'quantidadeEsperada', quantidadeOpts],
        ['Quantidade recebida', 'quantidadeRecebida', quantidadeOpts],
        ['Divergência', 'quantidadeDivergente', quantidadeOpts],
      ] as const;

      for (const [label, key, opts] of camposQuantidade) {
        const linha = descreverAlteracaoCampo(
          label,
          before[key],
          after[key],
          opts,
        );

        if (linha) {
          alteracoes.push(linha);
        }
      }
    }

    return alteracoes;
  }

  if (evento.tipoEvento === 'ITEM_REMOVIDO') {
    const snapshot = asItemValoresSnapshot(evento.metadata.itemSnapshot);

    if (!snapshot) {
      return [];
    }

    const removidoPeso = snapshot.subtipoOcorrencia === 'peso_divergente';
    const unidade = snapshot.unidadeMedida ?? context.unidadeMedida ?? null;
    const detalhes: string[] = [];

    if (snapshot.sku || snapshot.descricaoProduto) {
      detalhes.push(
        `Produto: ${snapshot.sku ?? snapshot.descricaoProduto ?? '—'}`,
      );
    }

    if (removidoPeso) {
      if (snapshot.pesoEsperado !== null && snapshot.pesoEsperado !== undefined) {
        detalhes.push(
          `Peso esperado: ${formatCncPesoKg(snapshot.pesoEsperado)}`,
        );
      }

      if (snapshot.pesoRecebido !== null && snapshot.pesoRecebido !== undefined) {
        detalhes.push(
          `Peso recebido: ${formatCncPesoKg(snapshot.pesoRecebido)}`,
        );
      }
    } else {
      if (
        snapshot.quantidadeEsperada !== null &&
        snapshot.quantidadeEsperada !== undefined
      ) {
        detalhes.push(
          `Quantidade esperada: ${formatCncQuantidade(snapshot.quantidadeEsperada, unidade)}`,
        );
      }

      if (
        snapshot.quantidadeRecebida !== null &&
        snapshot.quantidadeRecebida !== undefined
      ) {
        detalhes.push(
          `Quantidade recebida: ${formatCncQuantidade(snapshot.quantidadeRecebida, unidade)}`,
        );
      }
    }

    return detalhes;
  }

  return [];
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
      return 'Confira a diferença de peso na conferência PVAR. Compare peso esperado e recebido por caixa e avalie responsabilidade do fornecedor ou transportadora.';
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
