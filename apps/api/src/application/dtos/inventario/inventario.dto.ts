import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  DemandaContagemPrioridadeSchema,
  DemandaContagemStatusSchema,
  DemandaContagemTipoSchema,
  DemandaFiltrosSchema,
  DivergenciaInventarioStatusSchema,
  DivergenciaInventarioTipoSchema,
  InventarioStatusSchema,
  InventarioTipoSchema,
} from '../../../domain/model/inventario/inventario.model.js';

export const ListInventariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: InventarioStatusSchema.optional(),
});

export class ListInventariosQueryDto extends createZodDto(
  ListInventariosQuerySchema,
) {}

export const InventarioResponseSchema = z.object({
  id: z.uuid(),
  codigo: z.string(),
  nome: z.string(),
  tipo: InventarioTipoSchema,
  status: InventarioStatusSchema,
  dataProgramada: z.iso.datetime(),
  centroId: z.uuid(),
  responsavelGestorId: z.number().int().nullable(),
  responsavelGestorNome: z.string().nullable(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
  pausedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class InventarioResponseDto extends createZodDto(
  InventarioResponseSchema,
) {}

export const ListInventariosResponseSchema = z.object({
  items: z.array(InventarioResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

export class ListInventariosResponseDto extends createZodDto(
  ListInventariosResponseSchema,
) {}

export const InventarioKpiResponseSchema = z.object({
  acuraciaGlobal: z.number(),
  acuraciaDeltaPercent: z.number(),
  itensInventariados: z.number().int(),
  itensMeta: z.number().int(),
  divergenciasTotal: z.number().int(),
  divergenciasDelta: z.number().int(),
  statusAtualLabel: z.string(),
  tempoEstimadoLabel: z.string().nullable(),
});

export class InventarioKpiResponseDto extends createZodDto(
  InventarioKpiResponseSchema,
) {}

export const InventarioTrendResponseSchema = z.array(
  z.object({
    mes: z.string(),
    valorPercent: z.number(),
  }),
);

export class InventarioTrendResponseDto extends createZodDto(
  z.object({ items: InventarioTrendResponseSchema }),
) {}

export const InventarioDetalheResponseSchema = InventarioResponseSchema.extend({
  progressoPercent: z.number(),
  itensContados: z.number().int(),
  itensTotal: z.number().int(),
  acuraciaPercent: z.number().nullable(),
  divergenciasCount: z.number().int(),
  ajustesPendentesCount: z.number().int(),
  setoresProgresso: z.array(
    z.object({
      id: z.uuid(),
      nome: z.string(),
      progressPercent: z.number(),
      skuContados: z.number().int(),
      skuTotal: z.number().int(),
    }),
  ),
  divergencias: z.array(
    z.object({
      id: z.uuid(),
      contagemId: z.uuid(),
      enderecoMascarado: z.string(),
      zona: z.string(),
      produtoId: z.string().nullable(),
      sku: z.string(),
      produtoNome: z.string(),
      quantidadeEsperada: z.number(),
      quantidadeContada: z.number(),
      diferenca: z.number(),
      tipo: z.enum(['falta', 'sobra']),
      enderecoVazio: z.boolean(),
      anomaliaEncontrada: z.boolean(),
      pendenteAjuste: z.boolean(),
    }),
  ),
});

export class InventarioDetalheResponseDto extends createZodDto(
  InventarioDetalheResponseSchema,
) {}

export const DivergenciaRecontagemAtualResponseSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  demandaStatus: DemandaContagemStatusSchema,
  responsavelId: z.number().int(),
  responsavelNome: z.string(),
  solicitadaPor: z.number().int().nullable(),
  solicitadaEm: z.iso.datetime(),
  motivo: z.string(),
});

export class DivergenciaRecontagemAtualResponseDto extends createZodDto(
  DivergenciaRecontagemAtualResponseSchema,
) {}

export const DivergenciaInventarioResponseSchema = z.object({
  id: z.uuid(),
  inventarioId: z.uuid(),
  contagemId: z.uuid().nullable(),
  enderecoId: z.uuid(),
  enderecoMascarado: z.string(),
  zona: z.string(),
  saldoEnderecoId: z.uuid().nullable(),
  depositoId: z.uuid().nullable(),
  produtoId: z.string().nullable(),
  sku: z.string(),
  produtoNome: z.string(),
  quantidadeEsperada: z.number(),
  quantidadeContada: z.number(),
  delta: z.number(),
  unidadeMedida: z.string().nullable(),
  lote: z.string().nullable(),
  tipo: DivergenciaInventarioTipoSchema,
  status: DivergenciaInventarioStatusSchema,
  aprovadaPor: z.number().int().nullable(),
  aprovadaEm: z.iso.datetime().nullable(),
  motivoAprovacao: z.string().nullable(),
  reprovadaPor: z.number().int().nullable(),
  reprovadaEm: z.iso.datetime().nullable(),
  motivoReprovacao: z.string().nullable(),
  documentoRef: z.string(),
  recontagemAtual: DivergenciaRecontagemAtualResponseSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class DivergenciaInventarioResponseDto extends createZodDto(
  DivergenciaInventarioResponseSchema,
) {}

export const ListDivergenciasInventarioResponseSchema = z.object({
  items: z.array(DivergenciaInventarioResponseSchema),
});

export class ListDivergenciasInventarioResponseDto extends createZodDto(
  ListDivergenciasInventarioResponseSchema,
) {}

export const AprovarDivergenciaBodySchema = z.object({
  motivoAprovacao: z.string().optional(),
});

export class AprovarDivergenciaBodyDto extends createZodDto(
  AprovarDivergenciaBodySchema,
) {}

export const ReprovarDivergenciaBodySchema = z.object({
  motivoReprovacao: z.string().min(1),
});

export class ReprovarDivergenciaBodyDto extends createZodDto(
  ReprovarDivergenciaBodySchema,
) {}

export const DemandaContagemResponseSchema = z.object({
  id: z.uuid(),
  inventarioId: z.uuid(),
  nome: z.string(),
  tipo: DemandaContagemTipoSchema,
  prioridade: DemandaContagemPrioridadeSchema,
  status: z.enum([
    'aguardando_inicio',
    'em_andamento',
    'concluida',
    'cancelada',
  ]),
  responsavelId: z.number().int(),
  responsavelNome: z.string(),
  ativo: z.boolean(),
  filtros: DemandaFiltrosSchema,
  observacoes: z.string(),
  alertaFragilidade: z.boolean(),
  totalEnderecos: z.number().int(),
  enderecosConferidos: z.number().int(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export class DemandaContagemResponseDto extends createZodDto(
  DemandaContagemResponseSchema,
) {}

export const SaldoEsperadoEnderecoResponseSchema = z.object({
  saldoEnderecoId: z.uuid(),
  produtoId: z.string(),
  sku: z.string(),
  nome: z.string(),
  lote: z.string(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  numeroSerie: z.string(),
  unidadesPorCaixa: z.number().int().nullable(),
});

export const DemandaEnderecoResponseSchema = z.object({
  id: z.uuid(),
  demandaId: z.uuid(),
  enderecoId: z.uuid(),
  enderecoMascarado: z.string(),
  zona: z.string(),
  sequence: z.number().int(),
  status: z.enum(['pendente', 'em_andamento', 'conferido']),
  saldoEsperado: z.array(SaldoEsperadoEnderecoResponseSchema).optional(),
});

export class DemandaEnderecoResponseDto extends createZodDto(
  DemandaEnderecoResponseSchema,
) {}

export const PwaInventoryDemandResponseSchema = z.object({
  id: z.string(),
  type: DemandaContagemTipoSchema,
  zone: z.string(),
  aisle: z.string(),
  routeId: z.string(),
  isPriority: z.boolean().optional(),
});

export class PwaInventoryDemandResponseDto extends createZodDto(
  PwaInventoryDemandResponseSchema,
) {}

export const OperatorOptionResponseSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export class OperatorOptionResponseDto extends createZodDto(
  OperatorOptionResponseSchema,
) {}

export const ZonaOptionResponseSchema = z.object({
  zona: z.string(),
});

export class ZonaOptionResponseDto extends createZodDto(
  ZonaOptionResponseSchema,
) {}

export function toInventarioResponse(record: {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'ciclo' | 'geral';
  status: 'agendado' | 'em_progresso' | 'pausado' | 'concluido';
  dataProgramada: Date;
  centroId: string;
  responsavelGestorId: number | null;
  responsavelGestorNome: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  pausedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...record,
    dataProgramada: record.dataProgramada.toISOString(),
    startedAt: record.startedAt?.toISOString() ?? null,
    finishedAt: record.finishedAt?.toISOString() ?? null,
    pausedAt: record.pausedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toDemandaContagemResponse(record: {
  id: string;
  inventarioId: string;
  nome: string;
  tipo: 'cega' | 'validacao';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'aguardando_inicio' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavelId: number;
  responsavelNome: string;
  ativo: boolean;
  filtros: z.infer<typeof DemandaFiltrosSchema>;
  observacoes: string;
  alertaFragilidade: boolean;
  totalEnderecos: number;
  enderecosConferidos: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toDemandaEnderecoResponse(record: {
  id: string;
  demandaId: string;
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  sequence: number;
  status: 'pendente' | 'em_andamento' | 'conferido';
  saldoEsperado?: Array<{
    saldoEnderecoId: string;
    produtoId: string;
    sku: string;
    nome: string;
    lote: string;
    quantidade: number;
    unidadeMedida: string;
    numeroSerie: string;
    unidadesPorCaixa: number | null;
  }>;
}) {
  return {
    id: record.id,
    endereco: record.enderecoMascarado,
    status: record.status,
    sequence: record.sequence,
    saldoEsperado: record.saldoEsperado,
  };
}

export function toInventarioDivergenciaResponse(record: {
  id: string;
  contagemId: string;
  enderecoMascarado: string;
  zona: string;
  produtoId: string | null;
  sku: string;
  produtoNome: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  diferenca: number;
  tipo: 'falta' | 'sobra';
  enderecoVazio: boolean;
  anomaliaEncontrada: boolean;
  pendenteAjuste: boolean;
}) {
  return {
    id: record.id,
    contagemId: record.contagemId,
    sku: record.sku,
    produtoNome: record.produtoNome,
    setor: record.zona,
    endereco: record.enderecoMascarado,
    esperadoLabel: String(record.quantidadeEsperada),
    encontradoLabel: String(record.quantidadeContada),
    diferencaLabel:
      record.diferenca > 0 ? `+${record.diferenca}` : String(record.diferenca),
    tipo: record.tipo,
    enderecoVazio: record.enderecoVazio,
    anomaliaEncontrada: record.anomaliaEncontrada,
    pendenteAjuste: record.pendenteAjuste,
  };
}

export function toDivergenciaInventarioPersistidaResponse(record: {
  id: string;
  inventarioId: string;
  contagemId: string | null;
  enderecoId: string;
  enderecoMascarado: string;
  zona: string;
  saldoEnderecoId: string | null;
  depositoId: string | null;
  produtoId: string | null;
  sku: string;
  produtoNome: string;
  quantidadeEsperada: number;
  quantidadeContada: number;
  delta: number;
  unidadeMedida: string | null;
  lote: string | null;
  tipo: z.infer<typeof DivergenciaInventarioTipoSchema>;
  status: z.infer<typeof DivergenciaInventarioStatusSchema>;
  aprovadaPor: number | null;
  aprovadaEm: Date | null;
  motivoAprovacao: string | null;
  reprovadaPor: number | null;
  reprovadaEm: Date | null;
  motivoReprovacao: string | null;
  documentoRef: string;
  recontagemAtual: {
    id: string;
    demandaId: string;
    demandaStatus: z.infer<typeof DemandaContagemStatusSchema>;
    responsavelId: number;
    responsavelNome: string;
    solicitadaPor: number | null;
    solicitadaEm: Date;
    motivo: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...record,
    recontagemAtual: record.recontagemAtual
      ? {
          ...record.recontagemAtual,
          solicitadaEm: record.recontagemAtual.solicitadaEm.toISOString(),
        }
      : null,
    aprovadaEm: record.aprovadaEm?.toISOString() ?? null,
    reprovadaEm: record.reprovadaEm?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toDemandaUiItem(record: {
  id: string;
  nome: string;
  tipo: 'cega' | 'validacao';
  status: 'aguardando_inicio' | 'em_andamento' | 'concluida' | 'cancelada';
  responsavelNome: string;
  filtros: z.infer<typeof DemandaFiltrosSchema>;
}) {
  const rackLabel =
    record.filtros.rackInicio || record.filtros.rackFim
      ? `Racks ${record.filtros.rackInicio || '—'} até ${record.filtros.rackFim || '—'}`
      : '—';

  return {
    id: record.id,
    localTitulo: record.filtros.zonas.join(', '),
    localSubtitulo: rackLabel,
    responsavelNome: record.responsavelNome,
    tipo: record.tipo,
    status:
      record.status === 'aguardando_inicio'
        ? ('aguardando-inicio' as const)
        : ('aguardando-inicio' as const),
    iconName: record.tipo === 'cega' ? ('grid' as const) : ('snow' as const),
  };
}

export function toPwaInventoryDemand(record: {
  id: string;
  nome: string;
  tipo: 'cega' | 'validacao';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  filtros: z.infer<typeof DemandaFiltrosSchema>;
}) {
  const rackLabel =
    record.filtros.rackInicio || record.filtros.rackFim
      ? `Racks ${record.filtros.rackInicio || '—'}-${record.filtros.rackFim || '—'}`
      : '—';

  return {
    id: record.id,
    codigo: `#${record.nome}`,
    type: record.tipo,
    zone: record.filtros.zonas.join(', '),
    aisle: rackLabel,
    routeId: record.id,
    isPriority: record.prioridade === 'critica' || record.prioridade === 'alta',
  };
}
