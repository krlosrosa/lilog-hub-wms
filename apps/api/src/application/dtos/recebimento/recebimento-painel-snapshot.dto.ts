import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  GrauPrioridadePreRecebimentoSchema,
  PreRecebimentoSituacaoSchema,
} from '../../../domain/model/recebimento/recebimento.model.js';
import { RecursosSessaoKpiDtoSchema } from '../op-wms/demanda-separacao.dto.js';

const kpiAccentSchema = z.enum([
  'primary',
  'tertiary',
  'warning',
  'destructive',
  'muted',
]);

const docaStatusPainelSchema = z.enum(['ocupada', 'disponivel', 'manutencao']);

const sessaoPresencaStatusPainelSchema = z.enum([
  'presente',
  'esperado',
  'falta',
  'atestado',
  'folga',
  'atraso',
]);

const dateReferenciaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

export const GetRecebimentoPainelSnapshotQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  dataInicio: z.iso.datetime(),
  dataFim: z.iso.datetime(),
  dataReferencia: dateReferenciaSchema,
});

export class GetRecebimentoPainelSnapshotQueryDto extends createZodDto(
  GetRecebimentoPainelSnapshotQuerySchema,
) {}

const sessaoStatusOperacionalPainelSchema = z.enum([
  'atuando',
  'disponivel',
  'em_pausa',
  'indisponivel',
]);

export const RecebimentoPainelSnapshotResponseSchema = z.object({
  unidadeId: z.string(),
  dataReferencia: z.string(),
  turnoLabel: z.string(),
  geradoEm: z.iso.datetime(),
  totalPrevistoDia: z.number().int().nonnegative(),
  kpis: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      value: z.string(),
      suffix: z.string().optional(),
      accent: kpiAccentSchema,
      progress: z.number().min(0).max(100).optional(),
      footer: z.string().optional(),
    }),
  ),
  pipeline: z.array(
    z.object({
      situacao: PreRecebimentoSituacaoSchema,
      label: z.string(),
      count: z.number().int().nonnegative(),
      percentual: z.number().min(0).max(100),
    }),
  ),
  recebimentosPorHora: z.array(
    z.object({
      hora: z.string(),
      finalizados: z.number().int().nonnegative(),
      volumeUn: z.number().nonnegative(),
    }),
  ),
  rankingPorEmpresa: z.array(
    z.object({
      empresa: z.string(),
      qtdCarros: z.number().int().nonnegative(),
      volumePeso: z.number().nonnegative(),
      finalizados: z.number().int().nonnegative(),
      percentualPeso: z.number().min(0).max(100),
    }),
  ),
  docas: z.array(
    z.object({
      numero: z.number().int().positive(),
      status: docaStatusPainelSchema,
      placa: z.string().optional(),
      etiquetaManutencao: z.string().optional(),
      capacidadeToneladas: z.number().int().positive().optional(),
      tempoOcupacao: z.string().optional(),
      isPrioritaria: z.boolean().optional(),
      retornoManutencao: z.string().optional(),
    }),
  ),
  fila: z.array(
    z.object({
      preRecebimentoId: z.uuid(),
      recebimentoId: z.uuid().nullable(),
      placa: z.string(),
      transportadoraNome: z.string(),
      empresas: z.array(z.string()).min(1),
      docaCodigo: z.string().nullable(),
      horarioPrevisto: z.iso.datetime(),
      situacao: PreRecebimentoSituacaoSchema,
      skuCount: z.number().int().nonnegative(),
      volumeUn: z.number().nonnegative(),
      conferenteNome: z.string().nullable(),
      isAtrasado: z.boolean(),
      grauPrioridade: GrauPrioridadePreRecebimentoSchema.optional(),
    }),
  ),
  alertas: z.array(
    z.object({
      id: z.string(),
      severidade: z.enum(['error', 'warning', 'info']),
      mensagem: z.string(),
      placa: z.string().optional(),
    }),
  ),
  anomalias: z.object({
    resumo: z.object({
      totalOcorrencias: z.number().int().nonnegative(),
      recebimentosAfetados: z.number().int().nonnegative(),
      porCategoria: z.array(
        z.object({
          categoria: z.enum([
            'falta',
            'sobra',
            'avaria',
            'divergencia_peso',
          ]),
          label: z.string(),
          count: z.number().int().nonnegative(),
        }),
      ),
    }),
    rankingOrigens: z.array(
      z.object({
        centro: z.string(),
        nome: z.string(),
        count: z.number().int().nonnegative(),
        percentual: z.number().min(0).max(100),
      }),
    ),
  }),
  sessaoOperacional: z.object({
    sessaoId: z.string().nullable(),
    semSessaoAtiva: z.boolean(),
    equipeNome: z.string(),
    escalaNome: z.string(),
    status: z.enum(['planejada', 'aberta', 'encerrada', 'cancelada']),
    horaInicio: z.string(),
    horaFim: z.string(),
    presenca: z.object({
      presentes: z.number().int().nonnegative(),
      esperados: z.number().int().nonnegative(),
      faltas: z.number().int().nonnegative(),
      atrasos: z.number().int().nonnegative(),
      folgas: z.number().int().nonnegative(),
    }),
    kpis: z.array(RecursosSessaoKpiDtoSchema),
    conferentesAtivos: z.number().int().nonnegative(),
    emConferencia: z.number().int().nonnegative(),
    atuando: z.number().int().nonnegative(),
    ociosos: z.number().int().nonnegative(),
    emPausa: z.number().int().nonnegative(),
    precisamPausa: z.number().int().nonnegative(),
    demandasPendentes: z.number().int().nonnegative(),
    apoiosTotal: z.number().int().nonnegative(),
    gestaoRecursosPath: z.string().nullable(),
    operadores: z.array(
      z.object({
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
      }),
    ),
  }),
  produtividadeEquipe: z.object({
    taxaUtilizacao: z.number().min(0).max(100),
    tempoMedioGlobalMin: z.number().nonnegative(),
    mediaCarrosPorOperador: z.number().nonnegative(),
    operadores: z.array(
      z.object({
        funcionarioId: z.number().int(),
        nome: z.string(),
        cargo: z.string(),
        carros: z.number().int().nonnegative(),
        tempoMedioMin: z.number().nullable(),
        volumeUn: z.number().nonnegative(),
        statusOperacional: sessaoStatusOperacionalPainelSchema.nullable(),
        atividade: z.string().nullable(),
      }),
    ),
  }),
});

export class RecebimentoPainelSnapshotResponseDto extends createZodDto(
  RecebimentoPainelSnapshotResponseSchema,
) {}

export type RecebimentoPainelSnapshotDto = z.infer<
  typeof RecebimentoPainelSnapshotResponseSchema
>;
