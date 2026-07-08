import { and, count, desc, eq } from 'drizzle-orm';

import type { NotificacaoPortalRecord } from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { portalNotificacoes } from '../providers/drizzle/config/migrations/schema.js';

export type ListarNotificacoesPortalFilter = {
  transportadoraId: string;
  apenasNaoLidas?: boolean;
  limit?: number;
};

export async function listarNotificacoesPortalDb(
  db: DrizzleClient,
  filter: ListarNotificacoesPortalFilter,
): Promise<{
  notificacoes: NotificacaoPortalRecord[];
  totalNaoLidas: number;
}> {
  const conditions = [
    eq(portalNotificacoes.transportadoraId, filter.transportadoraId),
  ];

  if (filter.apenasNaoLidas) {
    conditions.push(eq(portalNotificacoes.lida, false));
  }

  const limit = filter.limit ?? 20;

  const rows = await db
    .select({
      id: portalNotificacoes.id,
      tipo: portalNotificacoes.tipo,
      titulo: portalNotificacoes.titulo,
      mensagem: portalNotificacoes.mensagem,
      rotaDestino: portalNotificacoes.rotaDestino,
      lida: portalNotificacoes.lida,
      createdAt: portalNotificacoes.createdAt,
    })
    .from(portalNotificacoes)
    .where(and(...conditions))
    .orderBy(desc(portalNotificacoes.createdAt))
    .limit(limit);

  const [contagem] = await db
    .select({ total: count() })
    .from(portalNotificacoes)
    .where(
      and(
        eq(portalNotificacoes.transportadoraId, filter.transportadoraId),
        eq(portalNotificacoes.lida, false),
      ),
    );

  return {
    notificacoes: rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      mensagem: row.mensagem,
      rotaDestino: row.rotaDestino,
      lida: row.lida,
      createdAt: row.createdAt,
    })),
    totalNaoLidas: Number(contagem?.total ?? 0),
  };
}
