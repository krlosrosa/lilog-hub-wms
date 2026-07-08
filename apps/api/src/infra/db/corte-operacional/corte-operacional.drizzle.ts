import { alias } from 'drizzle-orm/pg-core';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import type {
  CorteDetalheRecord,
  CorteItemRecord,
  CorteRecord,
  MapaGrupoCorteRecord,
  MapaGrupoItemCorteRecord,
  MapaGrupoItemValidacaoRecord,
} from '../../../domain/repositories/corte-operacional/corte-operacional.repository.js';
import type { CorteStatus } from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import type {
  DrizzleClient,
  DrizzleExecutor,
} from '../providers/drizzle/drizzle.provider.js';
import { users } from '../providers/drizzle/config/migrations/schema.js';
import {
  corteItens,
  cortes,
  mapaGrupoItens,
  mapaGrupos,
  mapaLotes,
  transportes,
} from '../providers/drizzle/config/migrations/schema.js';

const solicitanteUser = alias(users, 'solicitante_user');
const realizadorUser = alias(users, 'realizador_user');
const canceladorUser = alias(users, 'cancelador_user');

function toNumber(value: string | number | null | undefined): number {
  if (value == null) {
    return 0;
  }

  return typeof value === 'number' ? value : Number(value);
}

function toNullableNumber(
  value: string | number | null | undefined,
): number | null {
  if (value == null) {
    return null;
  }

  return toNumber(value);
}

export function mapCorteItemRow(row: {
  id: string;
  corteId: string;
  mapaGrupoItemId: string;
  sku: string;
  descricao: string | null;
  remessa: string;
  cliente: string;
  lote: string | null;
  quantidadeMapa: string;
  quantidadeCorte: string;
  unidadeMedida: string;
  pesoKg: string | null;
  createdAt: Date;
}): CorteItemRecord {
  return {
    id: row.id,
    corteId: row.corteId,
    mapaGrupoItemId: row.mapaGrupoItemId,
    sku: row.sku,
    descricao: row.descricao,
    remessa: row.remessa,
    cliente: row.cliente,
    lote: row.lote,
    quantidadeMapa: toNumber(row.quantidadeMapa),
    quantidadeCorte: toNumber(row.quantidadeCorte),
    unidadeMedida: row.unidadeMedida,
    pesoKg: toNullableNumber(row.pesoKg),
    createdAt: row.createdAt,
  };
}

export function mapCorteRow(row: {
  id: string;
  unidadeId: string;
  codigo: string;
  mapaGrupoId: string;
  transporteId: string;
  mapaGrupoMicroUuid: string;
  mapaGrupoTitulo: string;
  rota: string;
  doca: string | null;
  status: CorteStatus;
  motivo: string | null;
  observacao: string | null;
  totalVolumes: number | null;
  pesoTotalKg: string | null;
  solicitadoPor: number;
  solicitadoPorNome: string | null;
  solicitadoEm: Date;
  realizadoPor: number | null;
  realizadoPorNome: string | null;
  realizadoEm: Date | null;
  canceladoPor: number | null;
  canceladoPorNome: string | null;
  canceladoEm: Date | null;
  motivoCancelamento: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CorteRecord {
  return {
    id: row.id,
    unidadeId: row.unidadeId,
    codigo: row.codigo,
    mapaGrupoId: row.mapaGrupoId,
    transporteId: row.transporteId,
    mapaGrupoMicroUuid: row.mapaGrupoMicroUuid,
    mapaGrupoTitulo: row.mapaGrupoTitulo,
    rota: row.rota,
    doca: row.doca,
    status: row.status,
    motivo: row.motivo,
    observacao: row.observacao,
    totalVolumes: row.totalVolumes,
    pesoTotalKg: toNullableNumber(row.pesoTotalKg),
    solicitadoPor: row.solicitadoPor,
    solicitadoPorNome: row.solicitadoPorNome,
    solicitadoEm: row.solicitadoEm,
    realizadoPor: row.realizadoPor,
    realizadoPorNome: row.realizadoPorNome,
    realizadoEm: row.realizadoEm,
    canceladoPor: row.canceladoPor,
    canceladoPorNome: row.canceladoPorNome,
    canceladoEm: row.canceladoEm,
    motivoCancelamento: row.motivoCancelamento,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildMapaGrupoCodigoCondition(codigo: string) {
  if (isValidUuid(codigo)) {
    return or(eq(mapaGrupos.microUuid, codigo), eq(mapaGrupos.id, codigo));
  }

  return eq(mapaGrupos.microUuid, codigo);
}

export async function findMapaGrupoPorCodigoDb(
  db: DrizzleClient,
  codigo: string,
  unidadeId: string,
): Promise<MapaGrupoCorteRecord | null> {
  const [grupo] = await db
    .select({
      id: mapaGrupos.id,
      microUuid: mapaGrupos.microUuid,
      titulo: mapaGrupos.titulo,
      subtitulo: mapaGrupos.subtitulo,
      transporteId: mapaGrupos.transporteId,
      transporteRota: transportes.numeroTransporte,
      totalItens: mapaGrupos.totalItens,
      pesoTotal: mapaGrupos.pesoTotal,
      unidadeId: mapaLotes.unidadeId,
      processo: mapaGrupos.processo,
    })
    .from(mapaGrupos)
    .innerJoin(mapaLotes, eq(mapaGrupos.mapaLoteId, mapaLotes.id))
    .innerJoin(transportes, eq(mapaGrupos.transporteId, transportes.numeroTransporte))
    .where(
      and(
        eq(mapaLotes.unidadeId, unidadeId),
        buildMapaGrupoCodigoCondition(codigo),
      ),
    )
    .limit(1);

  if (!grupo) {
    return null;
  }

  const itensRows = await db
    .select({
      id: mapaGrupoItens.id,
      sku: mapaGrupoItens.sku,
      descricao: mapaGrupoItens.descricao,
      remessa: mapaGrupoItens.remessa,
      cliente: mapaGrupoItens.cliente,
      lote: mapaGrupoItens.lote,
      quantidade: mapaGrupoItens.quantidade,
      unidadeMedida: mapaGrupoItens.unidadeMedida,
      peso: mapaGrupoItens.peso,
    })
    .from(mapaGrupoItens)
    .where(eq(mapaGrupoItens.mapaGrupoId, grupo.id))
    .orderBy(mapaGrupoItens.sku);

  const itens: MapaGrupoItemCorteRecord[] = itensRows.map((item) => ({
    id: item.id,
    sku: item.sku,
    descricao: item.descricao,
    remessa: item.remessa,
    cliente: item.cliente,
    lote: item.lote,
    quantidade: toNumber(item.quantidade),
    unidadeMedida: item.unidadeMedida,
    peso: toNullableNumber(item.peso),
  }));

  return {
    id: grupo.id,
    microUuid: grupo.microUuid,
    titulo: grupo.titulo,
    subtitulo: grupo.subtitulo,
    transporteId: grupo.transporteId,
    transporteRota: grupo.transporteRota,
    totalItens: grupo.totalItens,
    pesoTotalKg: toNumber(grupo.pesoTotal),
    unidadeId: grupo.unidadeId,
    processo: grupo.processo,
    itens,
  };
}

export async function findMapaGrupoItensByIdsDb(
  db: DrizzleClient,
  mapaGrupoItemIds: string[],
  mapaGrupoId: string,
): Promise<MapaGrupoItemValidacaoRecord[]> {
  if (mapaGrupoItemIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: mapaGrupoItens.id,
      mapaGrupoId: mapaGrupoItens.mapaGrupoId,
      quantidade: mapaGrupoItens.quantidade,
      sku: mapaGrupoItens.sku,
      descricao: mapaGrupoItens.descricao,
      remessa: mapaGrupoItens.remessa,
      cliente: mapaGrupoItens.cliente,
      lote: mapaGrupoItens.lote,
      unidadeMedida: mapaGrupoItens.unidadeMedida,
      peso: mapaGrupoItens.peso,
    })
    .from(mapaGrupoItens)
    .where(
      and(
        eq(mapaGrupoItens.mapaGrupoId, mapaGrupoId),
        inArray(mapaGrupoItens.id, mapaGrupoItemIds),
      ),
    );

  return rows.map((row) => ({
    id: row.id,
    mapaGrupoId: row.mapaGrupoId,
    quantidade: toNumber(row.quantidade),
    sku: row.sku,
    descricao: row.descricao,
    remessa: row.remessa,
    cliente: row.cliente,
    lote: row.lote,
    unidadeMedida: row.unidadeMedida,
    peso: toNullableNumber(row.peso),
  }));
}

export async function existsCorteAtivoByMapaGrupoIdDb(
  db: DrizzleClient,
  mapaGrupoId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: cortes.id })
    .from(cortes)
    .where(
      and(
        eq(cortes.mapaGrupoId, mapaGrupoId),
        inArray(cortes.status, ['solicitado', 'em_andamento']),
      ),
    )
    .limit(1);

  return row != null;
}

async function gerarProximoCodigoCorte(
  tx: DrizzleExecutor,
  unidadeId: string,
): Promise<string> {
  const [row] = await tx
    .select({
      maxNumero: sql<number>`coalesce(max(
        case
          when ${cortes.codigo} ~ '^CORTE-[0-9]+$'
          then cast(substring(${cortes.codigo} from 7) as integer)
          else 0
        end
      ), 0)`,
    })
    .from(cortes)
    .where(eq(cortes.unidadeId, unidadeId));

  const proximo = (row?.maxNumero ?? 0) + 1;
  return `CORTE-${String(proximo).padStart(4, '0')}`;
}

function calcularPesoItem(
  pesoMapa: number | null,
  quantidadeMapa: number,
  quantidadeCorte: number,
): number | null {
  if (pesoMapa == null || quantidadeMapa <= 0) {
    return null;
  }

  return (pesoMapa * quantidadeCorte) / quantidadeMapa;
}

export async function solicitarCorteDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    mapaGrupoId: string;
    mapaGrupoMicroUuid: string;
    doca?: string;
    motivo?: string;
    observacao?: string;
    solicitadoPor: number;
    rota: string;
    transporteId: string;
    mapaGrupoTitulo: string;
    itens: Array<{
      mapaGrupoItemId: string;
      quantidadeCorte: number;
      sku: string;
      descricao: string | null;
      remessa: string;
      cliente: string;
      lote: string | null;
      quantidadeMapa: number;
      unidadeMedida: string;
      peso: number | null;
    }>;
  },
): Promise<CorteDetalheRecord> {
  return db.transaction(async (tx) => {
    const codigo = await gerarProximoCodigoCorte(tx, input.unidadeId);

    let pesoTotalKg = 0;
    let totalVolumes = 0;

    for (const item of input.itens) {
      totalVolumes += Math.ceil(item.quantidadeCorte);
      const pesoItem = calcularPesoItem(
        item.peso,
        item.quantidadeMapa,
        item.quantidadeCorte,
      );
      if (pesoItem != null) {
        pesoTotalKg += pesoItem;
      }
    }

    const [corte] = await tx
      .insert(cortes)
      .values({
        unidadeId: input.unidadeId,
        codigo,
        mapaGrupoId: input.mapaGrupoId,
        transporteId: input.transporteId,
        mapaGrupoMicroUuid: input.mapaGrupoMicroUuid,
        rota: input.rota,
        doca: input.doca ?? null,
        status: 'solicitado',
        motivo: input.motivo ?? null,
        observacao: input.observacao ?? null,
        totalVolumes,
        pesoTotalKg: pesoTotalKg > 0 ? String(pesoTotalKg) : null,
        solicitadoPor: input.solicitadoPor,
      })
      .returning({ id: cortes.id });

    if (!corte) {
      throw new Error('Falha ao criar corte');
    }

    await tx.insert(corteItens).values(
      input.itens.map((item) => ({
        corteId: corte.id,
        mapaGrupoItemId: item.mapaGrupoItemId,
        sku: item.sku,
        descricao: item.descricao,
        remessa: item.remessa,
        cliente: item.cliente,
        lote: item.lote,
        quantidadeMapa: String(item.quantidadeMapa),
        quantidadeCorte: String(item.quantidadeCorte),
        unidadeMedida: item.unidadeMedida,
        pesoKg:
          calcularPesoItem(
            item.peso,
            item.quantidadeMapa,
            item.quantidadeCorte,
          ) != null
            ? String(
                calcularPesoItem(
                  item.peso,
                  item.quantidadeMapa,
                  item.quantidadeCorte,
                ),
              )
            : null,
      })),
    );

    const detalhe = await findCorteByIdDb(tx, corte.id, input.unidadeId);
    if (!detalhe) {
      throw new Error('Corte criado não encontrado');
    }

    return detalhe;
  });
}

const corteSelectFields = {
  id: cortes.id,
  unidadeId: cortes.unidadeId,
  codigo: cortes.codigo,
  mapaGrupoId: cortes.mapaGrupoId,
  transporteId: cortes.transporteId,
  mapaGrupoMicroUuid: cortes.mapaGrupoMicroUuid,
  mapaGrupoTitulo: mapaGrupos.titulo,
  rota: cortes.rota,
  doca: cortes.doca,
  status: cortes.status,
  motivo: cortes.motivo,
  observacao: cortes.observacao,
  totalVolumes: cortes.totalVolumes,
  pesoTotalKg: cortes.pesoTotalKg,
  solicitadoPor: cortes.solicitadoPor,
  solicitadoPorNome: solicitanteUser.name,
  solicitadoEm: cortes.solicitadoEm,
  realizadoPor: cortes.realizadoPor,
  realizadoPorNome: realizadorUser.name,
  realizadoEm: cortes.realizadoEm,
  canceladoPor: cortes.canceladoPor,
  canceladoPorNome: canceladorUser.name,
  canceladoEm: cortes.canceladoEm,
  motivoCancelamento: cortes.motivoCancelamento,
  createdAt: cortes.createdAt,
  updatedAt: cortes.updatedAt,
};

function corteBaseQuery(db: DrizzleExecutor) {
  return db
    .select(corteSelectFields)
    .from(cortes)
    .innerJoin(mapaGrupos, eq(cortes.mapaGrupoId, mapaGrupos.id))
    .leftJoin(solicitanteUser, eq(cortes.solicitadoPor, solicitanteUser.id))
    .leftJoin(realizadorUser, eq(cortes.realizadoPor, realizadorUser.id))
    .leftJoin(canceladorUser, eq(cortes.canceladoPor, canceladorUser.id));
}

export async function findCorteByIdDb(
  db: DrizzleExecutor,
  corteId: string,
  unidadeId: string,
): Promise<CorteDetalheRecord | null> {
  const [row] = await corteBaseQuery(db)
    .where(and(eq(cortes.id, corteId), eq(cortes.unidadeId, unidadeId)))
    .limit(1);

  if (!row) {
    return null;
  }

  const itensRows = await db
    .select()
    .from(corteItens)
    .where(eq(corteItens.corteId, corteId))
    .orderBy(corteItens.sku);

  return {
    ...mapCorteRow(row),
    itens: itensRows.map(mapCorteItemRow),
  };
}

export async function listCortesDb(
  db: DrizzleClient,
  input: {
    unidadeId: string;
    page: number;
    limit: number;
    status?: CorteStatus;
    search?: string;
  },
): Promise<{ items: CorteRecord[]; total: number }> {
  const conditions = [eq(cortes.unidadeId, input.unidadeId)];

  if (input.status) {
    conditions.push(eq(cortes.status, input.status));
  }

  if (input.search?.trim()) {
    const term = `%${input.search.trim()}%`;
    conditions.push(
      or(
        ilike(cortes.codigo, term),
        ilike(cortes.rota, term),
        ilike(mapaGrupos.titulo, term),
        ilike(cortes.mapaGrupoMicroUuid, term),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(cortes)
    .innerJoin(mapaGrupos, eq(cortes.mapaGrupoId, mapaGrupos.id))
    .where(whereClause);

  const offset = (input.page - 1) * input.limit;

  const rows = await corteBaseQuery(db)
    .where(whereClause)
    .orderBy(desc(cortes.solicitadoEm))
    .limit(input.limit)
    .offset(offset);

  return {
    items: rows.map(mapCorteRow),
    total: countRow?.total ?? 0,
  };
}

export async function updateCorteStatusDb(
  db: DrizzleClient,
  input: {
    corteId: string;
    unidadeId: string;
    status: CorteStatus;
    userId: number;
    motivoCancelamento?: string;
  },
): Promise<CorteDetalheRecord | null> {
  const now = new Date();

  const patch: Partial<typeof cortes.$inferInsert> = {
    status: input.status,
    updatedAt: now,
  };

  if (input.status === 'concluido') {
    patch.realizadoPor = input.userId;
    patch.realizadoEm = now;
  }

  if (input.status === 'cancelado') {
    patch.canceladoPor = input.userId;
    patch.canceladoEm = now;
    patch.motivoCancelamento = input.motivoCancelamento ?? null;
  }

  const [updated] = await db
    .update(cortes)
    .set(patch)
    .where(
      and(eq(cortes.id, input.corteId), eq(cortes.unidadeId, input.unidadeId)),
    )
    .returning({ id: cortes.id });

  if (!updated) {
    return null;
  }

  return findCorteByIdDb(db, input.corteId, input.unidadeId);
}
