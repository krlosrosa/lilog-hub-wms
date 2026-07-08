import {
  and,
  asc,
  eq,
  inArray,
  notInArray,
  sql,
  type SQL,
} from 'drizzle-orm';

import { TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { FindEnderecoProximoDisponivelInput } from '../../../domain/repositories/endereco/endereco.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  enderecos,
  produtoEnderecos,
} from '../providers/drizzle/config/migrations/schema.js';

function parseEnderecoSegmentoNumerico(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function findEnderecoProximoDisponivelDb(
  db: DrizzleClient,
  input: FindEnderecoProximoDisponivelInput,
): Promise<string | null> {
  const excludeIds = input.excludeIds ?? [];

  const [referencia] = await db
    .select({
      zona: enderecos.zona,
      rua: enderecos.rua,
      posicao: enderecos.posicao,
      nivel: enderecos.nivel,
    })
    .from(produtoEnderecos)
    .innerJoin(enderecos, eq(produtoEnderecos.enderecoId, enderecos.id))
    .where(
      and(
        eq(produtoEnderecos.produtoId, input.produtoId),
        eq(produtoEnderecos.papel, 'picking_primario'),
        eq(produtoEnderecos.ativo, true),
        eq(enderecos.unidadeId, input.unidadeId),
      ),
    )
    .orderBy(asc(produtoEnderecos.ordem))
    .limit(1);

  if (!referencia) {
    return null;
  }

  const refPosicao = parseEnderecoSegmentoNumerico(referencia.posicao);
  const refNivel = parseEnderecoSegmentoNumerico(referencia.nivel);

  const conditions: SQL[] = [
    eq(enderecos.unidadeId, input.unidadeId),
    eq(enderecos.status, 'disponivel'),
    inArray(enderecos.tipo, [...TIPOS_ENDERECO_SUGESTAO_AUTOMATICA_ARMAZENAGEM]),
    eq(enderecos.zona, referencia.zona),
    eq(enderecos.rua, referencia.rua),
  ];

  if (excludeIds.length > 0) {
    conditions.push(notInArray(enderecos.id, excludeIds));
  }

  const [candidato] = await db
    .select({ id: enderecos.id })
    .from(enderecos)
    .where(and(...conditions))
    .orderBy(
      sql`abs(cast(${enderecos.posicao} as integer) - ${refPosicao})`,
      sql`case when cast(${enderecos.nivel} as integer) >= ${refNivel} then 0 else 1 end`,
      sql`abs(cast(${enderecos.nivel} as integer) - ${refNivel})`,
      asc(enderecos.enderecoMascarado),
    )
    .limit(1);

  return candidato?.id ?? null;
}
