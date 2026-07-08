import { eq, inArray } from 'drizzle-orm';

import type { SaveArmazemLayoutInput } from '../../../domain/model/armazem-layout/armazem-layout.model.js';
import type {
  ArmazemLayoutElementRecord,
  ArmazemLayoutOcupacaoRecord,
  ArmazemLayoutRecord,
  ArmazemLayoutSlotOcupacaoRecord,
  ArmazemLayoutSlotRecord,
} from '../../../domain/repositories/armazem-layout/armazem-layout.repository.js';
import type { DrizzleClient, DrizzleExecutor } from '../providers/drizzle/drizzle.provider.js';
import {
  armazemLayoutElementos,
  armazemLayoutSlots,
  armazemLayouts,
  enderecos,
} from '../providers/drizzle/config/migrations/schema.js';

type LayoutRow = typeof armazemLayouts.$inferSelect;
type ElementRow = typeof armazemLayoutElementos.$inferSelect;

function mapElement(row: ElementRow): ArmazemLayoutElementRecord {
  return {
    id: row.id,
    clientKey: row.clientKey,
    type: row.type,
    gx: row.gx,
    gy: row.gy,
    gw: row.gw,
    gh: row.gh,
    label: row.label,
    levels: row.levels,
    zona: row.zona,
    ordem: row.ordem,
  };
}

function buildSlotEnderecoKey(clientKey: string, nivel: number): string {
  return `${clientKey}:${nivel}`;
}

function buildSlotsForElement(
  elementRow: ElementRow,
  preservedLinks: Map<string, string | null>,
): Array<{ slotIndex: number; nivel: number; enderecoId: string | null }> {
  if (elementRow.type !== 'estante' || !elementRow.levels) {
    return [];
  }

  return Array.from({ length: elementRow.levels }, (_, index) => {
    const nivel = index + 1;
    return {
      slotIndex: 0,
      nivel,
      enderecoId:
        preservedLinks.get(buildSlotEnderecoKey(elementRow.clientKey, nivel)) ??
        null,
    };
  });
}

async function loadLayoutBundle(
  db: DrizzleExecutor,
  layout: LayoutRow,
): Promise<ArmazemLayoutRecord> {
  const elementRows = await db
    .select()
    .from(armazemLayoutElementos)
    .where(eq(armazemLayoutElementos.layoutId, layout.id))
    .orderBy(armazemLayoutElementos.ordem);

  const elementIds = elementRows.map((row) => row.id);
  const slotRows =
    elementIds.length === 0
      ? []
      : await db
          .select()
          .from(armazemLayoutSlots)
          .where(inArray(armazemLayoutSlots.elementoId, elementIds));

  const elementById = new Map(elementRows.map((row) => [row.id, row]));

  return {
    id: layout.id,
    unidadeId: layout.unidadeId,
    nome: layout.nome,
    gridCols: layout.gridCols,
    gridRows: layout.gridRows,
    versao: layout.versao,
    publicadoEm: layout.publicadoEm,
    elements: elementRows.map(mapElement),
    slots: slotRows.map((row) => ({
      id: row.id,
      elementoId: row.elementoId,
      elementClientKey:
        elementById.get(row.elementoId)?.clientKey ?? row.elementoId,
      slotIndex: row.slotIndex,
      nivel: row.nivel,
      enderecoId: row.enderecoId,
    })),
    createdAt: layout.createdAt,
    updatedAt: layout.updatedAt,
  };
}

export async function findArmazemLayoutByUnidadeDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<ArmazemLayoutRecord | null> {
  const [layout] = await db
    .select()
    .from(armazemLayouts)
    .where(eq(armazemLayouts.unidadeId, unidadeId))
    .limit(1);

  if (!layout) {
    return null;
  }

  return loadLayoutBundle(db, layout);
}

export async function saveArmazemLayoutDb(
  db: DrizzleClient,
  input: SaveArmazemLayoutInput,
): Promise<ArmazemLayoutRecord> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(armazemLayouts)
      .where(eq(armazemLayouts.unidadeId, input.unidadeId))
      .limit(1);

    const preservedLinks = new Map<string, string | null>();

    if (existing) {
      const oldElements = await tx
        .select()
        .from(armazemLayoutElementos)
        .where(eq(armazemLayoutElementos.layoutId, existing.id));

      if (oldElements.length > 0) {
        const oldElementIds = oldElements.map((row) => row.id);
        const oldSlots = await tx
          .select()
          .from(armazemLayoutSlots)
          .where(inArray(armazemLayoutSlots.elementoId, oldElementIds));

        const elementById = new Map(oldElements.map((row) => [row.id, row]));

        for (const slot of oldSlots) {
          const element = elementById.get(slot.elementoId);
          if (!element) continue;
          preservedLinks.set(
            buildSlotEnderecoKey(element.clientKey, slot.nivel),
            slot.enderecoId,
          );
        }
      }

      await tx
        .delete(armazemLayoutElementos)
        .where(eq(armazemLayoutElementos.layoutId, existing.id));
    }

    const [layout] = existing
      ? await tx
          .update(armazemLayouts)
          .set({
            nome: input.name,
            gridCols: input.gridCols,
            gridRows: input.gridRows,
            versao: existing.versao + 1,
            publicadoEm: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(armazemLayouts.id, existing.id))
          .returning()
      : await tx
          .insert(armazemLayouts)
          .values({
            unidadeId: input.unidadeId,
            nome: input.name,
            gridCols: input.gridCols,
            gridRows: input.gridRows,
            publicadoEm: new Date(),
          })
          .returning();

    if (!layout) {
      throw new Error('Failed to save armazem layout');
    }

    for (const [index, element] of input.elements.entries()) {
      const [elementRow] = await tx
        .insert(armazemLayoutElementos)
        .values({
          layoutId: layout.id,
          clientKey: element.id,
          type: element.type,
          gx: element.gx,
          gy: element.gy,
          gw: element.gw,
          gh: element.gh,
          label: element.label,
          levels: element.type === 'estante' ? (element.levels ?? 3) : null,
          zona: element.type === 'estante' ? (element.zona ?? null) : null,
          ordem: index,
        })
        .returning();

      if (!elementRow) {
        continue;
      }

      const slots = buildSlotsForElement(elementRow, preservedLinks);
      if (slots.length > 0) {
        await tx.insert(armazemLayoutSlots).values(
          slots.map((slot) => ({
            elementoId: elementRow.id,
            slotIndex: slot.slotIndex,
            nivel: slot.nivel,
            enderecoId: slot.enderecoId,
          })),
        );
      }
    }

    return loadLayoutBundle(tx, layout);
  });
}

export async function findArmazemLayoutOcupacaoByUnidadeDb(
  db: DrizzleClient,
  unidadeId: string,
): Promise<ArmazemLayoutOcupacaoRecord | null> {
  const layout = await findArmazemLayoutByUnidadeDb(db, unidadeId);
  if (!layout) {
    return null;
  }

  const enderecoIds = layout.slots
    .map((slot) => slot.enderecoId)
    .filter((id): id is string => Boolean(id));

  const enderecoRows =
    enderecoIds.length === 0
      ? []
      : await db
          .select({
            id: enderecos.id,
            enderecoMascarado: enderecos.enderecoMascarado,
            zona: enderecos.zona,
            rua: enderecos.rua,
            posicao: enderecos.posicao,
            nivel: enderecos.nivel,
            status: enderecos.status,
            ocupacaoPercent: enderecos.ocupacaoPercent,
          })
          .from(enderecos)
          .where(inArray(enderecos.id, enderecoIds));

  const enderecoById = new Map(enderecoRows.map((row) => [row.id, row]));

  const slots: ArmazemLayoutSlotOcupacaoRecord[] = layout.slots.map((slot) => {
    const endereco = slot.enderecoId
      ? (enderecoById.get(slot.enderecoId) ?? null)
      : null;

    return {
      ...slot,
      endereco: endereco
        ? {
            id: endereco.id,
            enderecoMascarado: endereco.enderecoMascarado,
            zona: endereco.zona,
            rua: endereco.rua,
            posicao: endereco.posicao,
            nivel: endereco.nivel,
            status: endereco.status,
            ocupacaoPercent: endereco.ocupacaoPercent,
          }
        : null,
    };
  });

  return {
    ...layout,
    slots,
  };
}

export async function vincularArmazemLayoutSlotEnderecoDb(
  db: DrizzleClient,
  slotId: string,
  enderecoId: string | null,
): Promise<ArmazemLayoutSlotRecord | null> {
  const [slot] = await db
    .update(armazemLayoutSlots)
    .set({
      enderecoId,
      updatedAt: new Date(),
    })
    .where(eq(armazemLayoutSlots.id, slotId))
    .returning();

  if (!slot) {
    return null;
  }

  const [element] = await db
    .select()
    .from(armazemLayoutElementos)
    .where(eq(armazemLayoutElementos.id, slot.elementoId))
    .limit(1);

  return {
    id: slot.id,
    elementoId: slot.elementoId,
    elementClientKey: element?.clientKey ?? slot.elementoId,
    slotIndex: slot.slotIndex,
    nivel: slot.nivel,
    enderecoId: slot.enderecoId,
  };
}
