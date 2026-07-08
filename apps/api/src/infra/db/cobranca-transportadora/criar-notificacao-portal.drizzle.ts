import type { CriarNotificacaoPortalInput } from '../../../domain/repositories/cobranca-transportadora/cobranca-transportadora.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { portalNotificacoes } from '../providers/drizzle/config/migrations/schema.js';

export async function criarNotificacaoPortalDb(
  db: DrizzleClient,
  input: CriarNotificacaoPortalInput,
): Promise<void> {
  await db.insert(portalNotificacoes).values({
    transportadoraId: input.transportadoraId,
    processoDebitoId: input.processoDebitoId ?? null,
    tipo: input.tipo,
    titulo: input.titulo,
    mensagem: input.mensagem,
    rotaDestino: input.rotaDestino,
  });
}
