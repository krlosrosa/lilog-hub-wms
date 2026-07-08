import { and, eq, or } from 'drizzle-orm';

import type { DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  remessas,
  transporteRemessas,
} from '../providers/drizzle/config/migrations/schema.js';

export type RemessaOrigemRow = {
  empresa: string;
  codCliente: string;
  cliente: string;
  cidade: string;
  volume: string;
};

export async function findRemessaOrigemPorNfDb(
  db: DrizzleExecutor,
  input: {
    transporteOrigemId: string;
    numeroNf: string;
    codCliente: string | null;
  },
): Promise<RemessaOrigemRow | null> {
  const conditions = [eq(remessas.remessa, input.numeroNf)];

  if (input.codCliente) {
    conditions.push(eq(remessas.codCliente, input.codCliente));
  }

  const [row] = await db
    .select({
      empresa: remessas.empresa,
      codCliente: remessas.codCliente,
      cliente: remessas.cliente,
      cidade: remessas.cidade,
      volume: remessas.volume,
    })
    .from(remessas)
    .innerJoin(
      transporteRemessas,
      eq(transporteRemessas.remessaId, remessas.id),
    )
    .where(
      and(
        eq(transporteRemessas.transporteId, input.transporteOrigemId),
        or(...conditions),
      ),
    )
    .limit(1);

  return row ?? null;
}
