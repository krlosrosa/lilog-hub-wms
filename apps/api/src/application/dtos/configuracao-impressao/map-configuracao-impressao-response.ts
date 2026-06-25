import type { ConfiguracaoImpressaoRecord } from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';

export function mapConfiguracaoImpressaoToResponse(
  record: ConfiguracaoImpressaoRecord,
) {
  return {
    id: record.id,
    unidadeId: record.unidadeId,
    nome: record.nome,
    configuracao: record.configuracao,
    templatesHtml: record.templatesHtml,
    isPadrao: record.isPadrao,
    criadoPor: record.criadoPor,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
