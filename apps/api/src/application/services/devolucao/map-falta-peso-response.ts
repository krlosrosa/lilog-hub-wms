import type { DevolucaoFaltaPesoRecord } from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { ValidarFaltaPesoResponseDto } from '../../dtos/devolucao/falta-peso-devolucao.dto.js';

export function mapFaltaPesoToResponse(
  record: DevolucaoFaltaPesoRecord,
): ValidarFaltaPesoResponseDto {
  return {
    id: record.id,
    demandaId: record.demandaId,
    notaFiscalId: record.notaFiscalId,
    itemId: record.itemId,
    sku: record.sku,
    descricaoProduto: record.descricaoProduto,
    pesoVariavel: record.pesoVariavel,
    pesoEsperadoKg: record.pesoEsperadoKg,
    pesoDevolvidoKg: record.pesoDevolvidoKg,
    pesoFaltanteKg: record.pesoFaltanteKg,
    quantidadeFiscalOriginal: record.quantidadeFiscalOriginal,
    quantidadeContabilConsiderada: record.quantidadeContabilConsiderada,
    tratativaContabil: record.tratativaContabil,
    zerarQuantidadeContabil: record.zerarQuantidadeContabil,
    motivo: record.motivo,
    observacao: record.observacao,
    status: record.status,
    registradoPorUserId: record.registradoPorUserId,
    registradoEm: record.registradoEm.toISOString(),
    validadoPorUserId: record.validadoPorUserId,
    validadoEm: record.validadoEm?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
