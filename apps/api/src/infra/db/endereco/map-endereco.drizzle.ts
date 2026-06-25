import type {
  CreateEnderecoData,
  UpdateEnderecoData,
} from '../../../domain/model/endereco/endereco.model.js';
import type {
  EnderecoCentroRecord,
  EnderecoRecord,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import type {
  centros,
  enderecos,
} from '../providers/drizzle/config/migrations/schema.js';

type EnderecoRow = typeof enderecos.$inferSelect;
type CentroRow = typeof centros.$inferSelect;

export function mapCentroToEnderecoRecord(row: CentroRow): EnderecoCentroRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    centro: row.centro.trim(),
    empresa: row.empresa,
    nome: row.nome,
  };
}

export function mapEnderecoRow(
  enderecoRow: EnderecoRow,
  centroRow: CentroRow,
): EnderecoRecord {
  return {
    id: enderecoRow.id,
    enderecoMascarado: enderecoRow.enderecoMascarado,
    centroId: enderecoRow.centroId,
    centro: mapCentroToEnderecoRecord(centroRow),
    zona: enderecoRow.zona,
    rua: enderecoRow.rua,
    posicao: enderecoRow.posicao,
    nivel: enderecoRow.nivel,
    tipo: enderecoRow.tipo,
    status: enderecoRow.status,
    tipoEstrutura: enderecoRow.tipoEstrutura,
    larguraMm: enderecoRow.larguraMm,
    alturaMm: enderecoRow.alturaMm,
    profundidadeMm: enderecoRow.profundidadeMm,
    cargaMaxKg: enderecoRow.cargaMaxKg,
    capacidadeVolume: enderecoRow.capacidadeVolume,
    prioridadePicking: enderecoRow.prioridadePicking,
    coordenadaX: enderecoRow.coordenadaX,
    coordenadaY: enderecoRow.coordenadaY,
    coordenadaZ: enderecoRow.coordenadaZ,
    observacao: enderecoRow.observacao,
    vinculoSkuFixo: enderecoRow.vinculoSkuFixo,
    regraLoteUnico: enderecoRow.regraLoteUnico,
    permiteMisturaValidade: enderecoRow.permiteMisturaValidade,
    permiteFracionado: enderecoRow.permiteFracionado,
    curvaAbc: enderecoRow.curvaAbc,
    ocupacaoPercent: enderecoRow.ocupacaoPercent,
    createdAt: enderecoRow.createdAt,
    updatedAt: enderecoRow.updatedAt,
  };
}

export function toEnderecoInsertValues(data: CreateEnderecoData) {
  return {
    enderecoMascarado: data.enderecoMascarado.trim().toUpperCase(),
    centroId: data.centroId,
    zona: data.zona.trim(),
    rua: data.rua.trim().padStart(4, '0'),
    posicao: data.posicao.trim().padStart(3, '0'),
    nivel: data.nivel.trim().padStart(2, '0'),
    tipo: data.tipo as EnderecoRow['tipo'],
    tipoEstrutura: data.tipoEstrutura as EnderecoRow['tipoEstrutura'],
    larguraMm: data.larguraMm,
    alturaMm: data.alturaMm,
    profundidadeMm: data.profundidadeMm,
    cargaMaxKg: String(data.cargaMaxKg),
    capacidadeVolume:
      data.capacidadeVolume !== undefined
        ? String(data.capacidadeVolume)
        : null,
    prioridadePicking: data.prioridadePicking ?? null,
    coordenadaX:
      data.coordenadaX !== undefined ? String(data.coordenadaX) : null,
    coordenadaY:
      data.coordenadaY !== undefined ? String(data.coordenadaY) : null,
    coordenadaZ:
      data.coordenadaZ !== undefined ? String(data.coordenadaZ) : null,
    observacao: data.observacao ?? null,
    vinculoSkuFixo: data.vinculoSkuFixo,
    regraLoteUnico: data.regraLoteUnico,
    permiteMisturaValidade: data.permiteMisturaValidade,
    permiteFracionado: data.permiteFracionado,
    curvaAbc: data.curvaAbc as EnderecoRow['curvaAbc'],
  };
}

export function toEnderecoUpdateValues(data: UpdateEnderecoData) {
  const values: Partial<typeof enderecos.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.enderecoMascarado !== undefined) {
    values.enderecoMascarado = data.enderecoMascarado.trim().toUpperCase();
  }
  if (data.centroId !== undefined) values.centroId = data.centroId;
  if (data.zona !== undefined) values.zona = data.zona.trim();
  if (data.rua !== undefined) values.rua = data.rua.trim().padStart(4, '0');
  if (data.posicao !== undefined) {
    values.posicao = data.posicao.trim().padStart(3, '0');
  }
  if (data.nivel !== undefined) values.nivel = data.nivel.trim().padStart(2, '0');
  if (data.tipo !== undefined) values.tipo = data.tipo as EnderecoRow['tipo'];
  if (data.status !== undefined) {
    values.status = data.status as EnderecoRow['status'];
  }
  if (data.tipoEstrutura !== undefined) {
    values.tipoEstrutura = data.tipoEstrutura as EnderecoRow['tipoEstrutura'];
  }
  if (data.larguraMm !== undefined) values.larguraMm = data.larguraMm;
  if (data.alturaMm !== undefined) values.alturaMm = data.alturaMm;
  if (data.profundidadeMm !== undefined) {
    values.profundidadeMm = data.profundidadeMm;
  }
  if (data.cargaMaxKg !== undefined) {
    values.cargaMaxKg = String(data.cargaMaxKg);
  }
  if (data.capacidadeVolume !== undefined) {
    values.capacidadeVolume =
      data.capacidadeVolume === null ? null : String(data.capacidadeVolume);
  }
  if (data.prioridadePicking !== undefined) {
    values.prioridadePicking = data.prioridadePicking;
  }
  if (data.coordenadaX !== undefined) {
    values.coordenadaX =
      data.coordenadaX === null ? null : String(data.coordenadaX);
  }
  if (data.coordenadaY !== undefined) {
    values.coordenadaY =
      data.coordenadaY === null ? null : String(data.coordenadaY);
  }
  if (data.coordenadaZ !== undefined) {
    values.coordenadaZ =
      data.coordenadaZ === null ? null : String(data.coordenadaZ);
  }
  if (data.observacao !== undefined) values.observacao = data.observacao;
  if (data.vinculoSkuFixo !== undefined) {
    values.vinculoSkuFixo = data.vinculoSkuFixo;
  }
  if (data.regraLoteUnico !== undefined) {
    values.regraLoteUnico = data.regraLoteUnico;
  }
  if (data.permiteMisturaValidade !== undefined) {
    values.permiteMisturaValidade = data.permiteMisturaValidade;
  }
  if (data.permiteFracionado !== undefined) {
    values.permiteFracionado = data.permiteFracionado;
  }
  if (data.curvaAbc !== undefined) {
    values.curvaAbc = data.curvaAbc as EnderecoRow['curvaAbc'];
  }
  if (data.ocupacaoPercent !== undefined) {
    values.ocupacaoPercent = String(data.ocupacaoPercent);
  }

  return values;
}
