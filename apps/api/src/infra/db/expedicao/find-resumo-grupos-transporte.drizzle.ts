import { eq } from 'drizzle-orm';

import type { ResumoGruposOperacionaisRecord } from '../../../domain/repositories/expedicao/transporte.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { mapaGrupos } from '../providers/drizzle/config/migrations/schema.js';

export async function findResumoGruposTransporteDb(
  db: DrizzleClient,
  transporteId: string,
): Promise<ResumoGruposOperacionaisRecord> {
  const rows = await db
    .select({
      processo: mapaGrupos.processo,
      iniciadoEm: mapaGrupos.iniciadoEm,
      finalizadoEm: mapaGrupos.finalizadoEm,
    })
    .from(mapaGrupos)
    .where(eq(mapaGrupos.transporteId, transporteId));

  const resumo: ResumoGruposOperacionaisRecord = {
    separacao: { total: 0, iniciados: 0, finalizados: 0 },
    conferencia: { total: 0, iniciados: 0, finalizados: 0 },
    carregamento: { total: 0, iniciados: 0, finalizados: 0 },
  };

  for (const row of rows) {
    const processo = resumo[row.processo];
    processo.total += 1;

    if (row.iniciadoEm != null) {
      processo.iniciados += 1;
    }

    if (row.finalizadoEm != null) {
      processo.finalizados += 1;
    }
  }

  return resumo;
}
