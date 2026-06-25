import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { createConfiguracaoOperacionalDb } from './create-configuracao-operacional.drizzle.js';
import { findConfiguracaoOperacionalByIdDb } from './find-configuracao-operacional-by-id.drizzle.js';

export async function duplicarConfiguracaoOperacionalDb(
  db: DrizzleClient,
  id: string,
) {
  const original = await findConfiguracaoOperacionalByIdDb(db, id);

  if (!original) {
    return null;
  }

  return createConfiguracaoOperacionalDb(db, {
    unidadeId: original.unidadeId,
    dominio: original.dominio,
    categoria: original.categoria,
    subtipo: original.subtipo,
    nome: `${original.nome} (cópia)`,
    descricao: original.descricao ?? undefined,
    parametros: original.parametros,
    versaoSchema: original.versaoSchema,
    isPadrao: false,
    ativo: original.ativo,
    criadoPor: original.criadoPor ?? undefined,
  });
}
