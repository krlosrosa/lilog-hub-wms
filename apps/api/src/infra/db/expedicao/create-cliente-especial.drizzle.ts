import type { CreateClienteEspecialInput } from '../../../domain/model/expedicao/cliente-especial.model.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { clientesEspeciais } from '../providers/drizzle/config/migrations/schema.js';
import { mapClienteEspecialRow } from './map-cliente-especial.drizzle.js';

export async function createClienteEspecialDb(
  db: DrizzleClient,
  data: CreateClienteEspecialInput,
) {
  const [record] = await db
    .insert(clientesEspeciais)
    .values({
      unidadeId: data.unidadeId,
      codCliente: data.codCliente.trim(),
      nomeCliente: data.nomeCliente.trim(),
      ativo: data.ativo ?? true,
      exigeSegregacaoMapa: data.exigeSegregacaoMapa ?? false,
      exigeSeparacaoEspecial: data.exigeSeparacaoEspecial ?? false,
      exigeCarregamentoEspecial: data.exigeCarregamentoEspecial ?? false,
      observacaoSeparacao: data.observacaoSeparacao ?? null,
      observacaoCarregamento: data.observacaoCarregamento ?? null,
      observacaoGeral: data.observacaoGeral ?? null,
      criadoPor: data.criadoPor ?? null,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create cliente especial');
  }

  return mapClienteEspecialRow(record);
}
