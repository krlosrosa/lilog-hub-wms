import type {
  ConferirItemInput,
  CreatePreRecebimentoInput,
  IniciarRecebimentoInput,
  NotaFiscalPreRecebimentoInput,
  UpdatePreRecebimentoInput,
} from '../../../domain/model/recebimento/recebimento.model.js';
import type {
  ItemPreRecebimentoRecord,
  NotaFiscalPreRecebimentoRecord,
  PreRecebimentoRecord,
} from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type {
  CreateDivergenciaInput,
  DivergenciaRecebimentoRecord,
  ItemRecebimentoRecord,
  PesagemRecebimentoRecord,
  RecebimentoRecord,
} from '../../../domain/repositories/recebimento/recebimento.repository.js';
import type {
  divergenciasRecebimento,
  itensPreRecebimento,
  itensRecebimento,
  notasFiscaisPreRecebimento,
  pesagensRecebimento,
  preRecebimentos,
  recebimentos,
} from '../providers/drizzle/config/migrations/schema.js';

type PreRecebimentoRow = typeof preRecebimentos.$inferSelect;
type ItemPreRecebimentoRow = typeof itensPreRecebimento.$inferSelect;
type NotaFiscalPreRecebimentoRow = typeof notasFiscaisPreRecebimento.$inferSelect;
type RecebimentoRow = typeof recebimentos.$inferSelect;
type ItemRecebimentoRow = typeof itensRecebimento.$inferSelect;
type PesagemRecebimentoRow = typeof pesagensRecebimento.$inferSelect;
type DivergenciaRow = typeof divergenciasRecebimento.$inferSelect;

function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function normalizePlaca(placa?: string | null): string | null {
  const trimmed = placa?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function mapPreRecebimentoRow(row: PreRecebimentoRow): PreRecebimentoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    transportadoraNome: row.transportadoraNome,
    placa: row.placa,
    motoristaNome: row.motoristaNome,
    motoristaTelefone: row.motoristaTelefone,
    grauPrioridade: row.grauPrioridade,
    numeroOcr: row.numeroOcr,
    numeroTransporte: row.numeroTransporte,
    origemDados: row.origemDados as PreRecebimentoRecord['origemDados'],
    origem: row.origem,
    horarioPrevisto: row.horarioPrevisto,
    observacao: row.observacao,
    quantidadePaletesEsperada: row.quantidadePaletesEsperada,
    numeroTermoPalete: row.numeroTermoPalete ?? null,
    situacao: row.situacao,
    dataChegada: row.dataChegada,
    docaId: row.docaId,
    rastreioToken: row.rastreioToken,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapNotaFiscalPreRecebimentoRow(
  row: NotaFiscalPreRecebimentoRow,
): NotaFiscalPreRecebimentoRecord {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    numeroNf: row.numeroNf,
    serie: row.serie,
    chaveAcesso: row.chaveAcesso,
    numeroRemessa: row.numeroRemessa,
    fornecedorNome: row.fornecedorNome,
    fornecedorDocumento: row.fornecedorDocumento,
    pesoTotal: toNumber(row.pesoTotal),
    volumeTotal: toNumber(row.volumeTotal),
    observacao: row.observacao,
    createdAt: row.createdAt,
  };
}

export function mapItemPreRecebimentoRow(
  row: ItemPreRecebimentoRow,
  unidadesPorCaixa = 1,
): ItemPreRecebimentoRecord {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    produtoId: row.produtoId,
    quantidadeEsperada: Number(row.quantidadeEsperada),
    unidadeMedida: row.unidadeMedida,
    unidadesPorCaixa,
    loteEsperado: row.loteEsperado,
    pesoEsperado: toNumber(row.pesoEsperado),
    validadeEsperada: row.validadeEsperada,
    createdAt: row.createdAt,
  };
}

export function mapRecebimentoRow(row: RecebimentoRow): RecebimentoRecord {
  return {
    id: row.id,
    preRecebimentoId: row.preRecebimentoId,
    docaId: row.docaId,
    responsavelId: row.responsavelId,
    dataInicio: row.dataInicio,
    dataFim: row.dataFim,
    situacao: row.situacao,
    quantidadePaletes: row.quantidadePaletes,
    modoUnitizacao: row.modoUnitizacao,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapItemRecebimentoRow(
  row: ItemRecebimentoRow,
): ItemRecebimentoRecord {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    unidadeId: row.unidadeId,
    produtoId: row.produtoId,
    quantidadeRecebida: Number(row.quantidadeRecebida),
    unidadeMedida: row.unidadeMedida,
    loteRecebido: row.loteRecebido,
    pesoRecebido: toNumber(row.pesoRecebido),
    validade: row.validade,
    numeroSerie: row.numeroSerie,
    unitizadorId: row.unitizadorId,
    createdAt: row.createdAt,
  };
}

export function mapPesagemRecebimentoRow(
  row: PesagemRecebimentoRow,
): PesagemRecebimentoRecord {
  return {
    id: row.id,
    recebimentoItemId: row.recebimentoItemId,
    unidadeId: row.unidadeId,
    sequenciaCaixa: row.sequenciaCaixa,
    etiquetaCodigo: row.etiquetaCodigo,
    pesoKg: Number(row.pesoKg),
    createdAt: row.createdAt,
  };
}

export function mapDivergenciaRow(
  row: DivergenciaRow,
): DivergenciaRecebimentoRecord {
  return {
    id: row.id,
    recebimentoId: row.recebimentoId,
    produtoId: row.produtoId,
    tipoDivergencia: row.tipoDivergencia,
    quantidadeEsperada: toNumber(row.quantidadeEsperada),
    quantidadeRecebida: toNumber(row.quantidadeRecebida),
    descricao: row.descricao,
    createdAt: row.createdAt,
  };
}

export function toPreRecebimentoInsertValues(
  data: CreatePreRecebimentoInput,
  userId: number | null,
) {
  return {
    unidadeId: data.unidadeId,
    transportadoraNome: data.transportadoraNome?.trim() || null,
    placa: normalizePlaca(data.placa),
    numeroOcr: data.numeroOcr?.trim() || null,
    numeroTransporte: data.numeroTransporte?.trim() || null,
    origemDados: data.origemDados ?? 'manual',
    origem: data.origem?.trim() || '3201',
    horarioPrevisto: data.horarioPrevisto,
    observacao: data.observacao ?? null,
    quantidadePaletesEsperada: data.quantidadePaletesEsperada ?? null,
    situacao: 'agendado' as PreRecebimentoRow['situacao'],
    userId,
  };
}

export function toNotaFiscalPreRecebimentoInsertValues(
  preRecebimentoId: string,
  nota: NotaFiscalPreRecebimentoInput,
) {
  return {
    preRecebimentoId,
    numeroNf: nota.numeroNf.trim(),
    serie: nota.serie?.trim() || null,
    chaveAcesso: nota.chaveAcesso?.trim() || null,
    numeroRemessa: nota.numeroRemessa?.trim() || null,
    fornecedorNome: nota.fornecedorNome?.trim() || null,
    fornecedorDocumento: nota.fornecedorDocumento?.trim() || null,
    pesoTotal:
      nota.pesoTotal !== undefined ? String(nota.pesoTotal) : null,
    volumeTotal:
      nota.volumeTotal !== undefined ? String(nota.volumeTotal) : null,
    observacao: nota.observacao ?? null,
  };
}

export function toItemPreRecebimentoInsertValues(
  preRecebimentoId: string,
  item: CreatePreRecebimentoInput['itens'][number],
) {
  return {
    preRecebimentoId,
    produtoId: item.produtoId,
    quantidadeEsperada: String(item.quantidadeEsperada),
    unidadeMedida: item.unidadeMedida,
    loteEsperado: item.loteEsperado ?? null,
    pesoEsperado:
      item.pesoEsperado !== undefined ? String(item.pesoEsperado) : null,
    validadeEsperada: item.validadeEsperada ?? null,
  };
}

export function toPreRecebimentoUpdateValues(data: UpdatePreRecebimentoInput) {
  const values: Partial<typeof preRecebimentos.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.transportadoraNome !== undefined) {
    values.transportadoraNome = data.transportadoraNome?.trim() || null;
  }

  if (data.placa !== undefined) {
    values.placa = normalizePlaca(data.placa);
  }

  if (data.numeroOcr !== undefined) {
    values.numeroOcr = data.numeroOcr?.trim() || null;
  }

  if (data.numeroTransporte !== undefined) {
    values.numeroTransporte = data.numeroTransporte?.trim() || null;
  }

  if (data.origemDados !== undefined) {
    values.origemDados = data.origemDados;
  }

  if (data.origem !== undefined) {
    values.origem = data.origem?.trim() || null;
  }

  if (data.horarioPrevisto !== undefined) {
    values.horarioPrevisto = data.horarioPrevisto;
  }

  if (data.observacao !== undefined) {
    values.observacao = data.observacao;
  }

  if (data.quantidadePaletesEsperada !== undefined) {
    values.quantidadePaletesEsperada = data.quantidadePaletesEsperada;
  }

  return values;
}

export function toRecebimentoInsertValues(
  data: IniciarRecebimentoInput,
  userId: number | null,
  modoUnitizacao: string,
) {
  return {
    preRecebimentoId: data.preRecebimentoId,
    docaId: data.docaId ?? null,
    responsavelId: data.responsavelId,
    dataInicio: new Date(),
    situacao: 'em_conferencia' as RecebimentoRow['situacao'],
    modoUnitizacao,
    userId,
  };
}

export function toItemRecebimentoInsertValues(
  recebimentoId: string,
  unidadeId: string,
  data: ConferirItemInput,
  unitizadorId?: string | null,
) {
  return {
    recebimentoId,
    unidadeId,
    produtoId: data.produtoId,
    quantidadeRecebida: String(data.quantidadeRecebida),
    unidadeMedida: data.unidadeMedida,
    loteRecebido: data.loteRecebido ?? null,
    pesoRecebido:
      data.pesoRecebido !== undefined ? String(data.pesoRecebido) : null,
    validade: data.validade ?? null,
    numeroSerie: data.numeroSerie ?? null,
    unitizadorId: unitizadorId ?? null,
  };
}

export function toDivergenciaInsertValues(data: CreateDivergenciaInput) {
  return {
    recebimentoId: data.recebimentoId,
    produtoId: data.produtoId ?? null,
    tipoDivergencia: data.tipoDivergencia as DivergenciaRow['tipoDivergencia'],
    quantidadeEsperada:
      data.quantidadeEsperada !== undefined && data.quantidadeEsperada !== null
        ? String(data.quantidadeEsperada)
        : null,
    quantidadeRecebida:
      data.quantidadeRecebida !== undefined && data.quantidadeRecebida !== null
        ? String(data.quantidadeRecebida)
        : null,
    descricao: data.descricao ?? null,
  };
}
