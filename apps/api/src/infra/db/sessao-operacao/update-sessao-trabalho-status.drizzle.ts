import { eq } from 'drizzle-orm';

import type { SessaoRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { sessoesTrabalho } from '../providers/drizzle/config/migrations/schema.js';
import { findSessaoByIdDb } from './find-sessao-trabalho.drizzle.js';

export async function abrirSessaoTrabalhoDb(
  db: DrizzleClient,
  id: string,
  userId: number,
): Promise<SessaoRecord> {
  const now = new Date();

  const [updated] = await db
    .update(sessoesTrabalho)
    .set({
      status: 'aberta',
      inicioReal: now,
      abertaPorUserId: userId,
      updatedAt: now,
    })
    .where(eq(sessoesTrabalho.id, id))
    .returning({ id: sessoesTrabalho.id });

  if (!updated) {
    throw new Error('Sessão não encontrada');
  }

  const sessao = await findSessaoByIdDb(db, id);
  if (!sessao) {
    throw new Error('Failed to load sessao');
  }

  return sessao;
}

export async function encerrarSessaoTrabalhoDb(
  db: DrizzleClient,
  id: string,
  userId: number,
): Promise<SessaoRecord> {
  const now = new Date();

  const [updated] = await db
    .update(sessoesTrabalho)
    .set({
      status: 'encerrada',
      fimReal: now,
      encerradaPorUserId: userId,
      updatedAt: now,
    })
    .where(eq(sessoesTrabalho.id, id))
    .returning({ id: sessoesTrabalho.id });

  if (!updated) {
    throw new Error('Sessão não encontrada');
  }

  const sessao = await findSessaoByIdDb(db, id);
  if (!sessao) {
    throw new Error('Failed to load sessao');
  }

  return sessao;
}

export async function cancelarSessaoTrabalhoDb(
  db: DrizzleClient,
  id: string,
): Promise<SessaoRecord> {
  const now = new Date();

  const [updated] = await db
    .update(sessoesTrabalho)
    .set({
      status: 'cancelada',
      updatedAt: now,
    })
    .where(eq(sessoesTrabalho.id, id))
    .returning({ id: sessoesTrabalho.id });

  if (!updated) {
    throw new Error('Sessão não encontrada');
  }

  const sessao = await findSessaoByIdDb(db, id);
  if (!sessao) {
    throw new Error('Failed to load sessao');
  }

  return sessao;
}
