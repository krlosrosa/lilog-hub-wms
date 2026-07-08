import { z } from 'zod';

export const demandaDevolucaoStatusSchema = z.enum([
  'rascunho',
  'aberta',
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
  'cancelada',
]);

export type DemandaDevolucaoStatus = z.infer<
  typeof demandaDevolucaoStatusSchema
>;

export const devolucaoNotaFiscalTipoSchema = z.enum([
  'reentrega',
  'devolucao_parcial',
  'devolucao_total',
]);

export type DevolucaoNotaFiscalTipo = z.infer<
  typeof devolucaoNotaFiscalTipoSchema
>;

export const demandaDevolucaoListItemSchema = z.object({
  id: z.string().uuid(),
  codigoDemanda: z.string(),
  status: demandaDevolucaoStatusSchema,
  observacao: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  concluidaAt: z.string().nullable(),
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  transporteId: z.string().nullable(),
  placa: z.string().nullable(),
  cliente: z.string().nullable(),
  tiposNf: z.array(devolucaoNotaFiscalTipoSchema),
  grupoDescargaId: z.string().uuid().nullable().optional(),
  codigoGrupo: z.string().nullable().optional(),
});

export type DemandaDevolucaoListItem = z.infer<
  typeof demandaDevolucaoListItemSchema
>;

export const devolucaoGestaoStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  rascunho: z.number().int().nonnegative(),
  aberta: z.number().int().nonnegative(),
  emAnalise: z.number().int().nonnegative(),
  emExecucao: z.number().int().nonnegative(),
  conferida: z.number().int().nonnegative(),
  concluida: z.number().int().nonnegative(),
  cancelada: z.number().int().nonnegative(),
});

export type DevolucaoGestaoStats = z.infer<typeof devolucaoGestaoStatsSchema>;

export type DevolucaoPesoPorStatus = {
  total: number;
  rascunho: number;
  aberta: number;
  emAnalise: number;
  emExecucao: number;
  conferida: number;
  concluida: number;
  cancelada: number;
};

const EMPTY_PESO: DevolucaoPesoPorStatus = {
  total: 0,
  rascunho: 0,
  aberta: 0,
  emAnalise: 0,
  emExecucao: 0,
  conferida: 0,
  concluida: 0,
  cancelada: 0,
};

export function computePesoPorStatus(
  demandas: DemandaDevolucaoListItem[],
): DevolucaoPesoPorStatus {
  const peso = { ...EMPTY_PESO };

  demandas.forEach((demanda) => {
    peso.total += demanda.pesoDevolvido;

    switch (demanda.status) {
      case 'rascunho':
        peso.rascunho += demanda.pesoDevolvido;
        break;
      case 'aberta':
        peso.aberta += demanda.pesoDevolvido;
        break;
      case 'em_analise':
        peso.emAnalise += demanda.pesoDevolvido;
        break;
      case 'em_execucao':
        peso.emExecucao += demanda.pesoDevolvido;
        break;
      case 'conferida':
        peso.conferida += demanda.pesoDevolvido;
        break;
      case 'concluida':
        peso.concluida += demanda.pesoDevolvido;
        break;
      case 'cancelada':
        peso.cancelada += demanda.pesoDevolvido;
        break;
    }
  });

  return peso;
}

export function formatPesoDevolucao(pesoKg: number): string {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(pesoKg)} kg`;
}

export const demandaDevolucaoFiltroStatusSchema = z.enum([
  'todos',
  'rascunho',
  'aberta',
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
  'cancelada',
]);

export type DemandaDevolucaoFiltroStatus = z.infer<
  typeof demandaDevolucaoFiltroStatusSchema
>;

export const DEMANDA_DEVOLUCAO_STATUS_LABELS: Record<
  DemandaDevolucaoStatus,
  string
> = {
  rascunho: 'Rascunho',
  aberta: 'Aberta',
  em_analise: 'Aguardando Conferência',
  em_execucao: 'Em Conferência',
  conferida: 'Conferido',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const DEVOLUCAO_NF_TIPO_LABELS: Record<DevolucaoNotaFiscalTipo, string> =
  {
    reentrega: 'Reentrega',
    devolucao_parcial: 'Dev. Parcial',
    devolucao_total: 'Dev. Total',
  };

export const FILTRO_STATUS_LABELS: Record<
  DemandaDevolucaoFiltroStatus,
  string
> = {
  todos: 'Todos',
  rascunho: 'Rascunho',
  aberta: 'Abertas',
  em_analise: 'Em Análise',
  em_execucao: 'Em Execução',
  conferida: 'Conferidas',
  concluida: 'Concluídas',
  cancelada: 'Canceladas',
};

export const FILTROS_STATUS: readonly DemandaDevolucaoFiltroStatus[] = [
  'todos',
  'aberta',
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
] as const;

export function canIniciarAnalise(status: DemandaDevolucaoStatus): boolean {
  return status === 'aberta';
}

export function canIniciarExecucao(status: DemandaDevolucaoStatus): boolean {
  return status === 'em_analise';
}

export function canConcluirDemanda(status: DemandaDevolucaoStatus): boolean {
  return status === 'conferida';
}

export function formatDemandaData(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function countDemandasPorTipoNf(
  demandas: DemandaDevolucaoListItem[],
): Record<DevolucaoNotaFiscalTipo, number> {
  const counts: Record<DevolucaoNotaFiscalTipo, number> = {
    reentrega: 0,
    devolucao_parcial: 0,
    devolucao_total: 0,
  };

  demandas.forEach((demanda) => {
    demanda.tiposNf.forEach((tipo) => {
      counts[tipo] += 1;
    });
  });

  return counts;
}
