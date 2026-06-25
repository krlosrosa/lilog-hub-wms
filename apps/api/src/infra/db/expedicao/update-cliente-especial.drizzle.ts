import { eq } from 'drizzle-orm';

import type { UpdateClienteEspecialInput } from '../../../domain/model/expedicao/cliente-especial.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';
import { mapClienteEspecialRow } from './map-cliente-especial.drizzle.js';

export async function updateClienteEspecialDb(
  db: DrizzleClient,
  id: string,
  data: UpdateClienteEspecialInput,
) {
  const patch: Partial<typeof clientesEspeciais.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.codCliente !== undefined) {
    patch.codCliente = data.codCliente.trim();
  }

  if (data.nomeCliente !== undefined) {
    patch.nomeCliente = data.nomeCliente.trim();
  }

  if (data.ativo !== undefined) {
    patch.ativo = data.ativo;
  }

  if (data.exigeSegregacaoMapa !== undefined) {
    patch.exigeSegregacaoMapa = data.exigeSegregacaoMapa;
  }

  if (data.exigeSeparacaoEspecial !== undefined) {
    patch.exigeSeparacaoEspecial = data.exigeSeparacaoEspecial;
  }

  if (data.exigeCarregamentoEspecial !== undefined) {
    patch.exigeCarregamentoEspecial = data.exigeCarregamentoEspecial;
  }

  if (data.observacaoSeparacao !== undefined) {
    patch.observacaoSeparacao = data.observacaoSeparacao;
  }

  if (data.observacaoCarregamento !== undefined) {
    patch.observacaoCarregamento = data.observacaoCarregamento;
  }

  if (data.observacaoGeral !== undefined) {
    patch.observacaoGeral = data.observacaoGeral;
  }

  const [record] = await db
    .update(clientesEspeciais)
    .set(patch)
    .where(eq(clientesEspeciais.id, id))
    .returning();

  return record ? mapClienteEspecialRow(record) : null;
}
