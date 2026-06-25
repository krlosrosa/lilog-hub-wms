import { eq } from 'drizzle-orm';

import type {
  SubmitContagemAvariaInput,
  SubmitContagemCegaInput,
  SubmitContagemValidacaoInput,
} from '../../../domain/model/inventario/inventario.model.js';
import type {
  ContagemAvariaRecord,
  ContagemRecord,
} from '../../../domain/repositories/inventario/inventario.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  contagemAvarias,
  contagens,
  demandaEnderecos,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapContagemAvariaRow,
  mapContagemRow,
} from './map-inventario.drizzle.js';

async function markEnderecoConferido(
  db: DrizzleClient,
  demandaEnderecoId: string,
): Promise<void> {
  await db
    .update(demandaEnderecos)
    .set({
      status: 'conferido',
      updatedAt: new Date(),
    })
    .where(eq(demandaEnderecos.id, demandaEnderecoId));
}

export async function submitContagemCegaDb(
  db: DrizzleClient,
  input: SubmitContagemCegaInput,
): Promise<ContagemRecord> {
  const [row] = await db
    .insert(contagens)
    .values({
      demandaEnderecoId: input.demandaEnderecoId,
      tipo: 'cega',
      operatorId: input.operatorId,
      codigoProduto: input.codigoProduto.trim(),
      quantidadeCaixas: input.quantidadeCaixas,
      quantidadeUnidades: input.quantidadeUnidades,
      lote: input.lote.trim(),
      peso: String(input.peso),
    })
    .returning();

  if (!row) {
    throw new Error('Failed to submit contagem cega');
  }

  await markEnderecoConferido(db, input.demandaEnderecoId);

  return mapContagemRow(row);
}

export async function submitContagemValidacaoDb(
  db: DrizzleClient,
  input: SubmitContagemValidacaoInput,
): Promise<ContagemRecord> {
  const [row] = await db
    .insert(contagens)
    .values({
      demandaEnderecoId: input.demandaEnderecoId,
      tipo: 'validacao',
      operatorId: input.operatorId,
      codigoProduto: input.codigoProduto.trim() || 'N/A',
      quantidadeCaixas: input.quantidadeCaixas,
      quantidadeUnidades: input.quantidadeUnidades,
      lote: input.lote?.trim() ?? null,
      peso: input.peso != null ? String(input.peso) : null,
      enderecoConfirmado: input.enderecoConfirmado?.trim() ?? null,
      sscc: input.sscc?.trim() ?? null,
      enderecoVazio: input.enderecoVazio,
      anomaliaEncontrada: input.anomaliaEncontrada,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to submit contagem validacao');
  }

  await markEnderecoConferido(db, input.demandaEnderecoId);

  return mapContagemRow(row);
}

export async function submitContagemAvariaDb(
  db: DrizzleClient,
  input: SubmitContagemAvariaInput,
): Promise<ContagemAvariaRecord> {
  const [row] = await db
    .insert(contagemAvarias)
    .values({
      demandaEnderecoId: input.demandaEnderecoId,
      contagemId: input.contagemId ?? null,
      motivo: input.motivo.trim(),
      quantidadeCaixas: input.quantidadeCaixas,
      quantidadeUnidades: input.quantidadeUnidades,
      photoCount: input.photoCount,
      operatorId: input.operatorId,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to submit contagem avaria');
  }

  return mapContagemAvariaRow(row);
}
