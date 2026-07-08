import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AlertaPausaDtoSchema,
  ProximaPausaDtoSchema,
  RecursosSessaoFuncionarioDtoSchema,
  RecursosSessaoKpiDtoSchema,
} from '../op-wms/demanda-separacao.dto.js';

export const DemandaDevolucaoStatusDtoSchema = z.enum([
  'rascunho',
  'aberta',
  'em_analise',
  'em_execucao',
  'conferida',
  'concluida',
  'cancelada',
]);

export const DevolucaoAlocacaoFuncaoDtoSchema = z.enum([
  'lider',
  'conferente',
  'auxiliar',
]);

export const DevolucaoAlocacaoEtapaDtoSchema = z.enum([
  'aguardando',
  'checklist',
  'conferencia',
  'finalizacao',
  'concluida',
]);

export const DemandaDevolucaoRecursoDtoSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  codigoDemanda: z.string(),
  status: DemandaDevolucaoStatusDtoSchema,
  etapa: DevolucaoAlocacaoEtapaDtoSchema,
  totalNfs: z.number().int().nonnegative(),
  totalItens: z.number().int().nonnegative(),
  pesoDevolvido: z.number().nonnegative(),
  cliente: z.string().nullable(),
  placa: z.string().nullable(),
  transporteId: z.string().nullable(),
  sessaoFuncionarioId: z.uuid(),
  funcionarioId: z.number().int(),
  funcao: DevolucaoAlocacaoFuncaoDtoSchema,
  atribuidoEm: z.iso.datetime(),
  inicioEm: z.iso.datetime().nullable(),
  tempoEsperadoMinutos: z.number().int().nonnegative(),
});

export class DemandaDevolucaoRecursoDto extends createZodDto(
  DemandaDevolucaoRecursoDtoSchema,
) {}

export const RecursosDevolucaoSessaoResponseDtoSchema = z.object({
  sessaoId: z.uuid(),
  unidadeId: z.string(),
  funcionarios: z.array(RecursosSessaoFuncionarioDtoSchema),
  alocacoes: z.array(DemandaDevolucaoRecursoDtoSchema),
  kpis: z.array(RecursosSessaoKpiDtoSchema),
});

export class RecursosDevolucaoSessaoResponseDto extends createZodDto(
  RecursosDevolucaoSessaoResponseDtoSchema,
) {}

export const DevolucaoSessaoIdParamSchema = z.object({
  sessaoId: z.uuid(),
});

export class DevolucaoSessaoIdParamDto extends createZodDto(
  DevolucaoSessaoIdParamSchema,
) {}

export const CriarAlocacaoDevolucaoResponseDtoSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  sessaoId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  funcao: DevolucaoAlocacaoFuncaoDtoSchema,
  status: z.enum(['em_andamento', 'concluida', 'cancelada']),
  atribuidoEm: z.iso.datetime(),
  inicioEm: z.iso.datetime().nullable(),
});

export class CriarAlocacaoDevolucaoResponseDto extends createZodDto(
  CriarAlocacaoDevolucaoResponseDtoSchema,
) {}

export const RemoverAlocacaoDevolucaoResponseDtoSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
});

export class RemoverAlocacaoDevolucaoResponseDto extends createZodDto(
  RemoverAlocacaoDevolucaoResponseDtoSchema,
) {}

export { AlertaPausaDtoSchema, ProximaPausaDtoSchema };
