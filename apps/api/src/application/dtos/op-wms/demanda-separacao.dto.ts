import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DemandaSeparacaoStatusDtoSchema = z.enum([
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada',
]);

export const MapaGrupoProcessoDtoSchema = z.enum([
  'separacao',
  'conferencia',
  'carregamento',
]);

export const DemandaFuncionarioPapelDtoSchema = z.enum([
  'responsavel',
  'auxiliar',
]);

export const DemandaFuncionarioDtoSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  sessaoFuncionarioId: z.uuid(),
  funcionarioId: z.number().int(),
  papel: DemandaFuncionarioPapelDtoSchema,
  entrouEm: z.iso.datetime(),
  saiuEm: z.iso.datetime().nullable(),
});

export class DemandaFuncionarioDto extends createZodDto(
  DemandaFuncionarioDtoSchema,
) {}

export const DemandaSeparacaoDtoSchema = z.object({
  id: z.uuid(),
  sessaoId: z.uuid(),
  mapaGrupoId: z.uuid(),
  mapaGrupoTitulo: z.string(),
  mapaGrupoMicroUuid: z.string(),
  mapaGrupoProcesso: MapaGrupoProcessoDtoSchema,
  transporteId: z.uuid(),
  transporteRota: z.string().nullable(),
  transporteDocaId: z.uuid().nullable().optional(),
  transporteLacreCarregamento: z.string().nullable().optional(),
  sessaoFuncionarioId: z.uuid(),
  funcionarioId: z.number().int(),
  status: DemandaSeparacaoStatusDtoSchema,
  atribuidoEm: z.iso.datetime(),
  iniciadoEm: z.iso.datetime().nullable(),
  finalizadoEm: z.iso.datetime().nullable(),
  tempoEsperadoMinutos: z.number().int(),
  funcionarios: z.array(DemandaFuncionarioDtoSchema).optional(),
});

export class DemandaSeparacaoDto extends createZodDto(DemandaSeparacaoDtoSchema) {}

export const MapaGrupoDisponivelDtoSchema = z.object({
  id: z.uuid(),
  mapaLoteId: z.uuid(),
  microUuid: z.string(),
  processo: MapaGrupoProcessoDtoSchema,
  titulo: z.string(),
  subtitulo: z.string().nullable(),
  transporteId: z.uuid(),
  transporteRota: z.string().nullable(),
  empresa: z.string(),
  categoria: z.string(),
  totalItens: z.number().int(),
  totalCaixas: z.number().int(),
  totalUnidades: z.number().int(),
  pesoTotalKg: z.number(),
  tempoEsperadoMinutos: z.number().int(),
  createdAt: z.iso.datetime(),
});

export class MapaGrupoDisponivelDto extends createZodDto(
  MapaGrupoDisponivelDtoSchema,
) {}

export const AlertaPausaDtoSchema = z.object({
  precisaPausa: z.boolean(),
  tipoSugerido: z.enum(['termica', 'refeicao', 'outros']),
  tempoTrabalhoContinuoMinutos: z.number().int().min(0),
  intervaloReferenciaMinutos: z.number().int().min(0),
  duracaoPausaMinutos: z.number().int().min(0),
  atrasoMinutos: z.number().int().min(0),
  referenciaTrabalhoIso: z.iso.datetime(),
});

export const ProximaPausaDtoSchema = AlertaPausaDtoSchema.extend({
  tempoRestanteMinutos: z.number().int().min(0),
});

export const RecursosSessaoFuncionarioDtoSchema = z.object({
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
});

export const RecursosSessaoKpiDtoSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  suffix: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  footer: z.string().optional(),
  accent: z.enum(['primary', 'tertiary', 'destructive', 'muted', 'warning']),
});

export const RecursosSessaoResponseDtoSchema = z.object({
  sessaoId: z.uuid(),
  unidadeId: z.string(),
  funcionarios: z.array(RecursosSessaoFuncionarioDtoSchema),
  demandas: z.array(DemandaSeparacaoDtoSchema),
  kpis: z.array(RecursosSessaoKpiDtoSchema),
});

export class RecursosSessaoResponseDto extends createZodDto(
  RecursosSessaoResponseDtoSchema,
) {}

export const ListMapasGrupoDisponiveisResponseDtoSchema = z.object({
  items: z.array(MapaGrupoDisponivelDtoSchema),
});

export class ListMapasGrupoDisponiveisResponseDto extends createZodDto(
  ListMapasGrupoDisponiveisResponseDtoSchema,
) {}

export const CriarDemandasResponseDtoSchema = z.object({
  demandas: z.array(DemandaSeparacaoDtoSchema),
});

export class CriarDemandasResponseDto extends createZodDto(
  CriarDemandasResponseDtoSchema,
) {}

export const SessaoIdParamSchema = z.object({
  sessaoId: z.uuid(),
});

export class SessaoIdParamDto extends createZodDto(SessaoIdParamSchema) {}

export const ListMapasGrupoDisponiveisQuerySchema = z.object({
  processo: MapaGrupoProcessoDtoSchema.optional(),
});

export class ListMapasGrupoDisponiveisQueryDto extends createZodDto(
  ListMapasGrupoDisponiveisQuerySchema,
) {}

export const ResumoMapasTransportesQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transporteIds: z
    .union([z.string().uuid(), z.array(z.string().uuid())])
    .transform((value) => (Array.isArray(value) ? value : [value]))
    .pipe(z.array(z.string().uuid()).min(1)),
});

export class ResumoMapasTransportesQueryDto extends createZodDto(
  ResumoMapasTransportesQuerySchema,
) {}

export const MapaResumoTransporteDtoSchema = z.object({
  transporteId: z.uuid(),
  totalMapas: z.number().int(),
  pesoTotalKg: z.number(),
  totalCaixas: z.number().int(),
  totalUnidades: z.number().int(),
  totalPaletes: z.number().int(),
  tempoTotalMinutos: z.number().int(),
});

export class MapaResumoTransporteDto extends createZodDto(
  MapaResumoTransporteDtoSchema,
) {}

export const ResumoMapasTransportesResponseDtoSchema = z.object({
  items: z.array(MapaResumoTransporteDtoSchema),
});

export class ResumoMapasTransportesResponseDto extends createZodDto(
  ResumoMapasTransportesResponseDtoSchema,
) {}
