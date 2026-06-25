import type { ConfiguracaoOperacionalRecord } from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';

export function mapConfiguracaoOperacionalToResponse(
  record: ConfiguracaoOperacionalRecord,
) {
  return {
    id: record.id,
    unidadeId: record.unidadeId,
    dominio: record.dominio,
    categoria: record.categoria,
    subtipo: record.subtipo,
    nome: record.nome,
    descricao: record.descricao,
    parametros: record.parametros,
    versaoSchema: record.versaoSchema,
    isPadrao: record.isPadrao,
    ativo: record.ativo,
    criadoPor: record.criadoPor,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
