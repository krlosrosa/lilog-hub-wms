import type { PerfilTarifaRecord } from '../../../domain/repositories/perfil-tarifa/perfil-tarifa.repository.js';

export function mapPerfilTarifaToResponse(record: PerfilTarifaRecord) {
  return {
    id: record.id,
    unidadeId: record.unidadeId,
    idRavex: record.idRavex,
    nome: record.nome,
    descricao: record.descricao,
    peso: record.peso,
    cubagem: record.cubagem,
    tipoCarga: record.tipoCarga,
    faixasKm: record.faixasKm.map((faixa) => ({
      id: faixa.id,
      kmInicial: faixa.kmInicial,
      kmFinal: faixa.kmFinal,
      valor: faixa.valor,
      itinerario: faixa.itinerario,
      createdAt: faixa.createdAt.toISOString(),
      updatedAt: faixa.updatedAt.toISOString(),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
