import type {
  ContagemAvariaRecord,
  ContagemRecord,
  DemandaContagemRecord,
  DemandaEnderecoRecord,
  InventarioDetalheRecord,
  InventarioRecord,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type {
  contagens,
  contagemAvarias,
  demandaEnderecos,
  demandasContagem,
  inventarios,
} from '../providers/drizzle/config/migrations/schema.js';

type InventarioRow = typeof inventarios.$inferSelect;
type DemandaRow = typeof demandasContagem.$inferSelect;
type DemandaEnderecoRow = typeof demandaEnderecos.$inferSelect;
type ContagemRow = typeof contagens.$inferSelect;
type ContagemAvariaRow = typeof contagemAvarias.$inferSelect;

export function mapInventarioRow(
  row: InventarioRow,
  responsavelGestorNome: string | null = null,
): InventarioRecord {
  return {
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    tipo: row.tipo,
    status: row.status,
    dataProgramada: row.dataProgramada,
    centroId: row.centroId,
    responsavelGestorId: row.responsavelGestorId,
    responsavelGestorNome,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    pausedAt: row.pausedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapDemandaRow(
  row: DemandaRow,
  responsavelNome: string,
  totalEnderecos: number,
  enderecosConferidos: number,
): DemandaContagemRecord {
  return {
    id: row.id,
    inventarioId: row.inventarioId,
    nome: row.nome,
    tipo: row.tipo,
    prioridade: row.prioridade,
    status: row.status,
    responsavelId: row.responsavelId,
    responsavelNome,
    ativo: row.ativo,
    filtros: row.filtros,
    observacoes: row.observacoes,
    alertaFragilidade: row.alertaFragilidade,
    totalEnderecos,
    enderecosConferidos,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapDemandaEnderecoRow(
  row: DemandaEnderecoRow,
  enderecoMascarado: string,
  zona: string,
): DemandaEnderecoRecord {
  return {
    id: row.id,
    demandaId: row.demandaId,
    enderecoId: row.enderecoId,
    enderecoMascarado,
    zona,
    sequence: row.sequence,
    status: row.status,
  };
}

export function mapContagemRow(row: ContagemRow): ContagemRecord {
  return {
    id: row.id,
    demandaEnderecoId: row.demandaEnderecoId,
    tipo: row.tipo,
    operatorId: row.operatorId,
    codigoProduto: row.codigoProduto,
    quantidadeCaixas: row.quantidadeCaixas,
    quantidadeUnidades: row.quantidadeUnidades,
    lote: row.lote,
    peso: row.peso,
    createdAt: row.createdAt,
  };
}

export function mapContagemAvariaRow(row: ContagemAvariaRow): ContagemAvariaRecord {
  return {
    id: row.id,
    demandaEnderecoId: row.demandaEnderecoId,
    motivo: row.motivo,
    quantidadeCaixas: row.quantidadeCaixas,
    quantidadeUnidades: row.quantidadeUnidades,
    photoCount: row.photoCount,
    createdAt: row.createdAt,
  };
}

export function mapInventarioDetalhe(
  inventario: InventarioRecord,
  itensContados: number,
  itensTotal: number,
  setoresProgresso: InventarioDetalheRecord['setoresProgresso'],
): InventarioDetalheRecord {
  const progressoPercent =
    itensTotal > 0 ? Math.round((itensContados / itensTotal) * 100) : 0;

  return {
    ...inventario,
    progressoPercent,
    itensContados,
    itensTotal,
    acuraciaPercent: null,
    divergenciasCount: 0,
    setoresProgresso,
  };
}

export function generateInventarioCodigo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `INV-${year}-${month}-${seq}`;
}

export function mapInventarioStatusToUiLabel(
  status: InventarioRecord['status'],
): string {
  const labels: Record<InventarioRecord['status'], string> = {
    agendado: 'Agendado',
    em_progresso: 'Em progresso',
    pausado: 'Pausado',
    concluido: 'Concluído',
  };
  return labels[status];
}

export function mapDemandaStatusToUi(
  status: DemandaContagemRecord['status'],
): 'aguardando-inicio' | 'em-andamento' | 'concluida' {
  if (status === 'em_andamento') return 'em-andamento';
  if (status === 'concluida') return 'concluida';
  return 'aguardando-inicio';
}

export function mapDemandaEnderecoStatusToPwa(
  status: DemandaEnderecoRecord['status'],
): 'pendente' | 'em_andamento' | 'conferido' {
  return status;
}
