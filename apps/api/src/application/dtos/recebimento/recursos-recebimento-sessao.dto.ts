import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AlertaPausaDtoSchema,
  ProximaPausaDtoSchema,
  RecursosSessaoKpiDtoSchema,
} from '../sessao-operacao/sessao-recursos.dto.js';

export const RecebimentoAlocacaoStatusDtoSchema = z.enum([
  'atribuida',
  'iniciada',
  'cancelada',
  'encerrada',
]);

export const RecebimentoAlocacaoPapelDtoSchema = z.enum(['responsavel', 'apoio']);

export const AlocacaoRecebimentoDtoSchema = z.object({
  id: z.uuid(),
  preRecebimentoId: z.uuid(),
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  funcionarioId: z.number().int(),
  papel: RecebimentoAlocacaoPapelDtoSchema.default('responsavel'),
  status: RecebimentoAlocacaoStatusDtoSchema,
  atribuidoEm: z.iso.datetime(),
  inicioEm: z.iso.datetime().nullable(),
  canceladoEm: z.iso.datetime().nullable(),
  encerradoEm: z.iso.datetime().nullable(),
});

export class AlocacaoRecebimentoDto extends createZodDto(AlocacaoRecebimentoDtoSchema) {}

export const DemandaRecebimentoRecursoStatusDtoSchema = z.enum([
  'disponivel',
  'atribuida',
  'em_conferencia',
  'impedido',
]);

export const DemandaRecebimentoRecursoDtoSchema = z.object({
  preRecebimentoId: z.uuid(),
  placa: z.string().nullable(),
  transportadoraNome: z.string().nullable(),
  horarioPrevisto: z.iso.datetime(),
  skuCount: z.number().int(),
  dock: z.string().nullable(),
  statusDemanda: DemandaRecebimentoRecursoStatusDtoSchema,
  recebimentoId: z.uuid().nullable(),
  recebimentoDataInicio: z.iso.datetime().nullable(),
  alocacao: z
    .object({
      id: z.uuid(),
      sessaoFuncionarioId: z.uuid(),
      funcionarioId: z.number().int(),
      funcionarioNome: z.string(),
      funcionarioMatricula: z.string(),
      atribuidoEm: z.iso.datetime(),
    })
    .nullable(),
  conferente: z
    .object({
      id: z.number().int(),
      nome: z.string(),
    })
    .nullable(),
  apoios: z
    .array(
      z.object({
        id: z.uuid(),
        funcionarioId: z.number().int(),
        funcionarioNome: z.string(),
        funcionarioMatricula: z.string(),
        status: RecebimentoAlocacaoStatusDtoSchema,
        atribuidoEm: z.iso.datetime(),
      }),
    )
    .default([]),
  empresas: z.array(z.string()).default([]),
  categorias: z.array(z.string()).default([]),
});

export class DemandaRecebimentoRecursoDto extends createZodDto(
  DemandaRecebimentoRecursoDtoSchema,
) {}

export const RecursosFuncionarioRecebimentoDtoSchema = z.object({
  id: z.uuid(),
  funcionarioId: z.number().int(),
  matricula: z.string(),
  nome: z.string(),
  cargo: z.string(),
  statusPresenca: z.enum([
    'esperado',
    'presente',
    'falta',
    'atestado',
    'folga',
    'atraso',
  ]),
  checkIn: z.iso.datetime().nullable(),
  checkOut: z.iso.datetime().nullable(),
  pausaAtiva: z
    .object({
      id: z.uuid(),
      tipo: z.enum(['termica', 'refeicao', 'outros']),
      inicio: z.iso.datetime(),
    })
    .nullable(),
  alertaPausa: AlertaPausaDtoSchema.nullable(),
  proximaPausa: ProximaPausaDtoSchema.nullable(),
  tipoVinculo: z.enum(['titular', 'apoio']),
  equipeOrigemNome: z.string().nullable(),
  apoioInicio: z.iso.datetime().nullable(),
  ultimaMissaoFinalizadaEm: z.iso.datetime().nullable(),
});

export class RecursosFuncionarioRecebimentoDto extends createZodDto(
  RecursosFuncionarioRecebimentoDtoSchema,
) {}

export const RecursosRecebimentoSessaoResponseDtoSchema = z.object({
  sessaoId: z.uuid(),
  unidadeId: z.string(),
  funcionarios: z.array(RecursosFuncionarioRecebimentoDtoSchema),
  demandas: z.array(DemandaRecebimentoRecursoDtoSchema),
  kpis: z.array(RecursosSessaoKpiDtoSchema),
});

export class RecursosRecebimentoSessaoResponseDto extends createZodDto(
  RecursosRecebimentoSessaoResponseDtoSchema,
) {}
