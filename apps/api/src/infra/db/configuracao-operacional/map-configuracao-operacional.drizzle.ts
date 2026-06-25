import type {
  ParametrosConfiguracaoOperacional,
  SubtipoConfiguracao,
} from '../../../domain/model/configuracao-operacional/configuracao-operacional.model.js';
import type { ConfiguracaoOperacionalRecord } from '../../../domain/repositories/configuracao-operacional/configuracao-operacional.repository.js';
import type { configuracoesOperacionais } from '../providers/drizzle/config/migrations/schema.js';

export function mapConfiguracaoOperacionalRow(
  row: typeof configuracoesOperacionais.$inferSelect,
): ConfiguracaoOperacionalRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    dominio: row.dominio,
    categoria: row.categoria,
    subtipo: row.subtipo as SubtipoConfiguracao,
    nome: row.nome,
    descricao: row.descricao,
    parametros: row.parametros as ParametrosConfiguracaoOperacional,
    versaoSchema: row.versaoSchema,
    isPadrao: row.isPadrao,
    ativo: row.ativo,
    criadoPor: row.criadoPor,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
