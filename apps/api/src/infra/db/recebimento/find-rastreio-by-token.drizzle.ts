import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import type { RastreioStatusRecord } from '../../../domain/repositories/recebimento/pre-recebimento.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  docas,
  preRecebimentos,
  recebimentos,
  unidades,
} from '../providers/drizzle/config/migrations/schema.js';

const preDocas = alias(docas, 'pre_docas');

function formatDocaNome(
  nome: string | null,
  codigo: string | null,
): string | null {
  if (nome?.trim()) {
    return nome.trim();
  }

  if (!codigo?.trim()) {
    return null;
  }

  if (/^\d+$/.test(codigo)) {
    return `Doca ${codigo}`;
  }

  return codigo.startsWith('Doca') ? codigo : `Doca ${codigo}`;
}

export async function findRastreioByTokenDb(
  db: DrizzleClient,
  token: string,
): Promise<RastreioStatusRecord | null> {
  const [row] = await db
    .select({
      placa: preRecebimentos.placa,
      transportadoraNome: preRecebimentos.transportadoraNome,
      situacao: preRecebimentos.situacao,
      horarioPrevisto: preRecebimentos.horarioPrevisto,
      dataChegada: preRecebimentos.dataChegada,
      unidadeNome: unidades.nome,
      docaNome: docas.nome,
      docaCodigo: docas.codigo,
      preDocaNome: preDocas.nome,
      preDocaCodigo: preDocas.codigo,
    })
    .from(preRecebimentos)
    .innerJoin(unidades, eq(preRecebimentos.unidadeId, unidades.id))
    .leftJoin(
      recebimentos,
      eq(recebimentos.preRecebimentoId, preRecebimentos.id),
    )
    .leftJoin(docas, eq(recebimentos.docaId, docas.id))
    .leftJoin(preDocas, eq(preRecebimentos.docaId, preDocas.id))
    .where(eq(preRecebimentos.rastreioToken, token))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    placa: row.placa,
    transportadoraNome: row.transportadoraNome,
    situacao: row.situacao,
    docaNome: formatDocaNome(
      row.docaNome ?? row.preDocaNome,
      row.docaCodigo ?? row.preDocaCodigo,
    ),
    horarioPrevisto: row.horarioPrevisto,
    dataChegada: row.dataChegada,
    unidadeNome: row.unidadeNome,
  };
}
