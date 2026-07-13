import { z } from 'zod';

import {
  docaItemSchema,
  recebimentoStatusSchema,
} from '@/features/recebimento/types/recebimento-lista.schema';
import { kpiDashboardSchema } from '@/features/dashboard-operacional/types/dashboard-operacional.schema';

export const grauPrioridadePainelSchema = z.enum([
  'baixo',
  'normal',
  'alto',
  'urgente',
]);

export type GrauPrioridadePainel = z.infer<typeof grauPrioridadePainelSchema>;

export const pontoRecebimentoHoraSchema = z.object({
  hora: z.string(),
  finalizados: z.number().int().nonnegative(),
  volumeUn: z.number().nonnegative(),
});

export type PontoRecebimentoHora = z.infer<typeof pontoRecebimentoHoraSchema>;

export const rankingEmpresaRecebimentoSchema = z.object({
  empresa: z.string(),
  qtdCarros: z.number().int().nonnegative(),
  volumePeso: z.number().nonnegative(),
  finalizados: z.number().int().nonnegative(),
  percentualPeso: z.number().min(0).max(100),
});

export type RankingEmpresaRecebimento = z.infer<
  typeof rankingEmpresaRecebimentoSchema
>;

export const pipelineRecebimentoSchema = z.object({
  situacao: recebimentoStatusSchema,
  label: z.string(),
  count: z.number().int().nonnegative(),
  percentual: z.number().min(0).max(100),
});

export type PipelineRecebimento = z.infer<typeof pipelineRecebimentoSchema>;

export const filaRecebimentoPainelSchema = z.object({
  preRecebimentoId: z.string(),
  recebimentoId: z.string().nullable(),
  placa: z.string(),
  transportadoraNome: z.string(),
  empresas: z.array(z.string()).min(1),
  docaCodigo: z.string().nullable(),
  horarioPrevisto: z.string(),
  situacao: recebimentoStatusSchema,
  skuCount: z.number().int().nonnegative(),
  volumeUn: z.number().nonnegative(),
  conferenteNome: z.string().nullable(),
  isAtrasado: z.boolean(),
  grauPrioridade: grauPrioridadePainelSchema.optional(),
});

export type FilaRecebimentoPainel = z.infer<typeof filaRecebimentoPainelSchema>;

export const alertaPainelSchema = z.object({
  id: z.string(),
  severidade: z.enum(['error', 'warning', 'info']),
  mensagem: z.string(),
  placa: z.string().optional(),
});

export type AlertaPainel = z.infer<typeof alertaPainelSchema>;

export const anomaliaCategoriaPainelSchema = z.enum([
  'falta',
  'sobra',
  'avaria',
  'divergencia_peso',
]);

export type AnomaliaCategoriaPainel = z.infer<
  typeof anomaliaCategoriaPainelSchema
>;

export const anomaliaCategoriaResumoSchema = z.object({
  categoria: anomaliaCategoriaPainelSchema,
  label: z.string(),
  count: z.number().int().nonnegative(),
});

export type AnomaliaCategoriaResumo = z.infer<
  typeof anomaliaCategoriaResumoSchema
>;

export const anomaliasResumoPainelSchema = z.object({
  totalOcorrencias: z.number().int().nonnegative(),
  recebimentosAfetados: z.number().int().nonnegative(),
  porCategoria: z.array(anomaliaCategoriaResumoSchema),
});

export type AnomaliasResumoPainel = z.infer<typeof anomaliasResumoPainelSchema>;

export const rankingOrigemAnomaliaSchema = z.object({
  centro: z.string(),
  nome: z.string(),
  count: z.number().int().nonnegative(),
  percentual: z.number().min(0).max(100),
});

export type RankingOrigemAnomalia = z.infer<typeof rankingOrigemAnomaliaSchema>;

export const anomaliasPainelSchema = z.object({
  resumo: anomaliasResumoPainelSchema,
  rankingOrigens: z.array(rankingOrigemAnomaliaSchema),
});

export type AnomaliasPainel = z.infer<typeof anomaliasPainelSchema>;

export const sessaoPresencaStatusPainelSchema = z.enum([
  'presente',
  'esperado',
  'falta',
  'atestado',
  'folga',
  'atraso',
]);

export type SessaoPresencaStatusPainel = z.infer<
  typeof sessaoPresencaStatusPainelSchema
>;

export const sessaoStatusOperacionalPainelSchema = z.enum([
  'atuando',
  'disponivel',
  'em_pausa',
  'indisponivel',
]);

export type SessaoStatusOperacionalPainel = z.infer<
  typeof sessaoStatusOperacionalPainelSchema
>;

export const sessaoOperadorPainelSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cargo: z.string(),
  status: sessaoPresencaStatusPainelSchema,
  statusOperacional: sessaoStatusOperacionalPainelSchema,
  atividade: z.string().nullable(),
  placaAtual: z.string().nullable(),
  docaAtual: z.string().nullable(),
  precisaPausa: z.boolean(),
  tipoVinculo: z.enum(['titular', 'apoio']),
});

export type SessaoOperadorPainel = z.infer<typeof sessaoOperadorPainelSchema>;

export const sessaoPresencaResumoSchema = z.object({
  presentes: z.number().int().nonnegative(),
  esperados: z.number().int().nonnegative(),
  faltas: z.number().int().nonnegative(),
  atrasos: z.number().int().nonnegative(),
  folgas: z.number().int().nonnegative(),
});

export type SessaoPresencaResumo = z.infer<typeof sessaoPresencaResumoSchema>;

export const sessaoOperacionalPainelSchema = z.object({
  sessaoId: z.string().nullable(),
  semSessaoAtiva: z.boolean(),
  equipeNome: z.string(),
  escalaNome: z.string(),
  status: z.enum(['planejada', 'aberta', 'encerrada', 'cancelada']),
  horaInicio: z.string(),
  horaFim: z.string(),
  presenca: sessaoPresencaResumoSchema,
  kpis: z.array(kpiDashboardSchema),
  conferentesAtivos: z.number().int().nonnegative(),
  emConferencia: z.number().int().nonnegative(),
  atuando: z.number().int().nonnegative(),
  ociosos: z.number().int().nonnegative(),
  emPausa: z.number().int().nonnegative(),
  precisamPausa: z.number().int().nonnegative(),
  demandasPendentes: z.number().int().nonnegative(),
  apoiosTotal: z.number().int().nonnegative(),
  gestaoRecursosPath: z.string().nullable(),
  operadores: z.array(sessaoOperadorPainelSchema),
});

export type SessaoOperacionalPainel = z.infer<
  typeof sessaoOperacionalPainelSchema
>;

export const produtividadeOperadorPainelSchema = z.object({
  funcionarioId: z.number().int(),
  nome: z.string(),
  cargo: z.string(),
  carros: z.number().int().nonnegative(),
  tempoMedioMin: z.number().nullable(),
  volumeUn: z.number().nonnegative(),
  statusOperacional: sessaoStatusOperacionalPainelSchema.nullable(),
  atividade: z.string().nullable(),
});

export type ProdutividadeOperadorPainel = z.infer<
  typeof produtividadeOperadorPainelSchema
>;

export const produtividadeEquipePainelSchema = z.object({
  taxaUtilizacao: z.number().min(0).max(100),
  tempoMedioGlobalMin: z.number().nonnegative(),
  mediaCarrosPorOperador: z.number().nonnegative(),
  operadores: z.array(produtividadeOperadorPainelSchema),
});

export type ProdutividadeEquipePainel = z.infer<
  typeof produtividadeEquipePainelSchema
>;

export const recebimentoPainelSnapshotSchema = z.object({
  unidadeId: z.string(),
  dataReferencia: z.string(),
  turnoLabel: z.string(),
  geradoEm: z.string(),
  totalPrevistoDia: z.number().int().nonnegative(),
  kpis: z.array(kpiDashboardSchema),
  pipeline: z.array(pipelineRecebimentoSchema),
  recebimentosPorHora: z.array(pontoRecebimentoHoraSchema),
  rankingPorEmpresa: z.array(rankingEmpresaRecebimentoSchema),
  docas: z.array(docaItemSchema),
  fila: z.array(filaRecebimentoPainelSchema),
  alertas: z.array(alertaPainelSchema),
  anomalias: anomaliasPainelSchema,
  sessaoOperacional: sessaoOperacionalPainelSchema,
  produtividadeEquipe: produtividadeEquipePainelSchema,
});

export type RecebimentoPainelSnapshot = z.infer<
  typeof recebimentoPainelSnapshotSchema
>;
