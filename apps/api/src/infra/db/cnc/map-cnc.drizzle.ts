import type {
  AddCncEventoInput,
  CancelarCncInput,
  CncEventoRecord,
  CncItemRecord,
  CncRecord,
  CncTratativaRecord,
  ConcluirCncTratativaInput,
  CreateCncInput,
  CreateCncTratativaInput,
  EncerrarCncInput,
  IniciarAnaliseCncInput,
  UpdateCncItemInput,
} from '../../../domain/repositories/cnc/cnc.repository.js';
import type {
  cncEventos,
  cncItens,
  cncTratativas,
  naoConformidades,
} from '../providers/drizzle/config/migrations/schema.js';

type CncRow = typeof naoConformidades.$inferSelect;
type CncItemRow = typeof cncItens.$inferSelect;
type CncEventoRow = typeof cncEventos.$inferSelect;
type CncTratativaRow = typeof cncTratativas.$inferSelect;

function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

export function mapCncRow(row: CncRow): CncRecord {
  return {
    id: row.id,
    numero: row.numero,
    origem: row.origem,
    origemId: row.origemId,
    unidadeId: row.unidadeId,
    responsavel: row.responsavel,
    responsavelId: row.responsavelId,
    descricao: row.descricao,
    observacao: row.observacao,
    situacao: row.situacao,
    solicitanteId: row.solicitanteId,
    analistaId: row.analistaId,
    iniciadoEm: row.iniciadoEm,
    encerradoEm: row.encerradoEm,
    encerradoPorUserId: row.encerradoPorUserId,
    valorDebito: toNumber(row.valorDebito),
    opcoesImpressao: row.opcoesImpressao ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapCncItemRow(row: CncItemRow): CncItemRecord {
  return {
    id: row.id,
    cncId: row.cncId,
    tipo: row.tipo,
    referenciaId: row.referenciaId,
    produtoId: row.produtoId,
    sku: row.sku,
    descricaoProduto: row.descricaoProduto,
    subtipoOcorrencia: row.subtipoOcorrencia,
    quantidadeEsperada: toNumber(row.quantidadeEsperada),
    quantidadeRecebida: toNumber(row.quantidadeRecebida),
    quantidadeDivergente: toNumber(row.quantidadeDivergente),
    quantidadeCaixas: row.quantidadeCaixas,
    quantidadeUnidades: row.quantidadeUnidades,
    unidadeMedida: row.unidadeMedida,
    loteEsperado: row.loteEsperado,
    loteRecebido: row.loteRecebido,
    validadeEsperada: row.validadeEsperada,
    validadeRecebida: row.validadeRecebida,
    pesoEsperado: toNumber(row.pesoEsperado),
    pesoRecebido: toNumber(row.pesoRecebido),
    naturezaAvaria: row.naturezaAvaria,
    causaAvaria: row.causaAvaria,
    tipoAvaria: row.tipoAvaria,
    shelfLifeDias: row.shelfLifeDias,
    descricaoDetalhe: row.descricaoDetalhe,
    responsavelSugerido: row.responsavelSugerido,
    createdAt: row.createdAt,
  };
}

export function mapCncEventoRow(row: CncEventoRow): CncEventoRecord {
  return {
    id: row.id,
    cncId: row.cncId,
    tipoEvento: row.tipoEvento,
    situacaoAnterior: row.situacaoAnterior,
    situacaoNova: row.situacaoNova,
    descricao: row.descricao,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    criadoPorUserId: row.criadoPorUserId,
    createdAt: row.createdAt,
  };
}

export function mapCncTratativaRow(row: CncTratativaRow): CncTratativaRecord {
  return {
    id: row.id,
    cncId: row.cncId,
    tipo: row.tipo as CncTratativaRecord['tipo'],
    descricao: row.descricao,
    responsavelTipo: row.responsavelTipo as CncTratativaRecord['responsavelTipo'],
    prazo: row.prazo,
    concluidaEm: row.concluidaEm,
    concluidaPorUserId: row.concluidaPorUserId,
    status: row.status as CncTratativaRecord['status'],
    criadoPorUserId: row.criadoPorUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toCncInsertValues(data: CreateCncInput) {
  return {
    numero: data.numero,
    origem: data.origem as CncRow['origem'],
    origemId: data.origemId,
    unidadeId: data.unidadeId,
    responsavel: data.responsavel as CncRow['responsavel'],
    responsavelId: data.responsavelId ?? null,
    descricao: data.descricao ?? null,
    situacao: 'pendente' as CncRow['situacao'],
    solicitanteId: data.solicitanteId,
  };
}

export function toCncItemInsertValues(
  cncId: string,
  item: CreateCncInput['itens'][number],
) {
  return {
    cncId,
    tipo: item.tipo as CncItemRow['tipo'],
    referenciaId: item.referenciaId,
    produtoId: item.produtoId ?? null,
    sku: item.sku ?? null,
    descricaoProduto: item.descricaoProduto ?? null,
    subtipoOcorrencia: item.subtipoOcorrencia as CncItemRow['subtipoOcorrencia'],
    quantidadeEsperada:
      item.quantidadeEsperada !== null && item.quantidadeEsperada !== undefined
        ? String(item.quantidadeEsperada)
        : null,
    quantidadeRecebida:
      item.quantidadeRecebida !== null && item.quantidadeRecebida !== undefined
        ? String(item.quantidadeRecebida)
        : null,
    quantidadeDivergente:
      item.quantidadeDivergente !== null &&
      item.quantidadeDivergente !== undefined
        ? String(item.quantidadeDivergente)
        : null,
    quantidadeCaixas: item.quantidadeCaixas ?? null,
    quantidadeUnidades: item.quantidadeUnidades ?? null,
    unidadeMedida: item.unidadeMedida ?? null,
    loteEsperado: item.loteEsperado ?? null,
    loteRecebido: item.loteRecebido ?? null,
    validadeEsperada: toDate(item.validadeEsperada),
    validadeRecebida: toDate(item.validadeRecebida),
    pesoEsperado:
      item.pesoEsperado !== null && item.pesoEsperado !== undefined
        ? String(item.pesoEsperado)
        : null,
    pesoRecebido:
      item.pesoRecebido !== null && item.pesoRecebido !== undefined
        ? String(item.pesoRecebido)
        : null,
    naturezaAvaria: item.naturezaAvaria ?? null,
    causaAvaria: item.causaAvaria ?? null,
    tipoAvaria: item.tipoAvaria ?? null,
    shelfLifeDias: item.shelfLifeDias ?? null,
    descricaoDetalhe: item.descricaoDetalhe ?? null,
    responsavelSugerido: item.responsavelSugerido as CncItemRow['responsavelSugerido'],
  };
}

export function toCncItemUpdateValues(data: UpdateCncItemInput) {
  const values: Partial<typeof cncItens.$inferInsert> = {};

  if (data.quantidadeEsperada !== undefined) {
    values.quantidadeEsperada =
      data.quantidadeEsperada !== null
        ? String(data.quantidadeEsperada)
        : null;
  }

  if (data.quantidadeRecebida !== undefined) {
    values.quantidadeRecebida =
      data.quantidadeRecebida !== null
        ? String(data.quantidadeRecebida)
        : null;
  }

  if (data.quantidadeDivergente !== undefined) {
    values.quantidadeDivergente =
      data.quantidadeDivergente !== null
        ? String(data.quantidadeDivergente)
        : null;
  }

  if (data.pesoEsperado !== undefined) {
    values.pesoEsperado =
      data.pesoEsperado !== null ? String(data.pesoEsperado) : null;
  }

  if (data.pesoRecebido !== undefined) {
    values.pesoRecebido =
      data.pesoRecebido !== null ? String(data.pesoRecebido) : null;
  }

  return values;
}

export function toIniciarAnaliseUpdateValues(data: IniciarAnaliseCncInput) {
  return {
    situacao: 'em_analise' as CncRow['situacao'],
    analistaId: data.analistaId,
    iniciadoEm: data.iniciadoEm,
    updatedAt: new Date(),
  };
}

export function toEncerrarCncUpdateValues(data: EncerrarCncInput) {
  const values: Partial<typeof naoConformidades.$inferInsert> = {
    situacao: 'encerrada',
    encerradoPorUserId: data.encerradoPorUserId,
    encerradoEm: data.encerradoEm,
    updatedAt: new Date(),
  };

  if (data.responsavel !== undefined) {
    values.responsavel = data.responsavel as CncRow['responsavel'];
  }

  if (data.responsavelId !== undefined) {
    values.responsavelId = data.responsavelId;
  }

  if (data.valorDebito !== undefined) {
    values.valorDebito =
      data.valorDebito !== null ? String(data.valorDebito) : null;
  }

  if (data.observacao !== undefined) {
    values.observacao = data.observacao;
  }

  return values;
}

export function toCancelarCncUpdateValues(data: CancelarCncInput) {
  return {
    situacao: 'cancelada' as CncRow['situacao'],
    encerradoPorUserId: data.encerradoPorUserId,
    encerradoEm: data.encerradoEm,
    updatedAt: new Date(),
  };
}

export function toCncTratativaInsertValues(data: CreateCncTratativaInput) {
  return {
    cncId: data.cncId,
    tipo: data.tipo,
    descricao: data.descricao,
    responsavelTipo: data.responsavelTipo,
    prazo: data.prazo ?? null,
    criadoPorUserId: data.criadoPorUserId,
    status: 'pendente',
  };
}

export function toConcluirTratativaUpdateValues(
  data: ConcluirCncTratativaInput,
) {
  return {
    status: 'concluida',
    concluidaEm: data.concluidaEm,
    concluidaPorUserId: data.concluidaPorUserId,
    updatedAt: new Date(),
  };
}

export function toCncEventoInsertValues(data: AddCncEventoInput) {
  return {
    cncId: data.cncId,
    tipoEvento: data.tipoEvento,
    situacaoAnterior: data.situacaoAnterior ?? null,
    situacaoNova: data.situacaoNova ?? null,
    descricao: data.descricao ?? null,
    metadata: data.metadata ?? {},
    criadoPorUserId: data.criadoPorUserId ?? null,
  };
}
