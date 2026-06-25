import type {
  ConfiguracaoImpressaoConteudo,
  TemplatesHtml,
} from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import type { ConfiguracaoImpressaoRecord } from '../../../domain/repositories/configuracao-impressao/configuracao-impressao.repository.js';
import type { configuracoesImpressao } from '../providers/drizzle/config/migrations/schema.js';

export function mapConfiguracaoImpressaoRow(
  row: typeof configuracoesImpressao.$inferSelect,
): ConfiguracaoImpressaoRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    nome: row.nome,
    configuracao: row.configuracao as ConfiguracaoImpressaoConteudo,
    templatesHtml: row.templatesHtml as TemplatesHtml,
    isPadrao: row.isPadrao,
    criadoPor: row.criadoPor,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
