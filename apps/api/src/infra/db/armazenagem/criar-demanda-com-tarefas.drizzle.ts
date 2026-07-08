import type { CreateDemandaArmazenagemInput } from '../../../domain/model/armazenagem/armazenagem.model.js';
import type { DemandaArmazenagemWithItens } from '../../../domain/repositories/armazenagem/armazenagem.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasArmazenagem,
  itensArmazenagem,
  tarefasArmazenagem,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  mapDemandaArmazenagemRow,
  mapItemArmazenagemRow,
} from './map-armazenagem.drizzle.js';

export type CriarDemandaComTarefasTransacionalInput = {
  demanda: CreateDemandaArmazenagemInput;
};

export async function criarDemandaComTarefasTransacionalDb(
  db: DrizzleClient,
  input: CriarDemandaComTarefasTransacionalInput,
): Promise<DemandaArmazenagemWithItens> {
  return db.transaction(async (tx) => {
    const [demanda] = await tx
      .insert(demandasArmazenagem)
      .values({
        unidadeId: input.demanda.unidadeId,
        recebimentoId: input.demanda.recebimentoId,
        modoUnitizacao: input.demanda.modoUnitizacao,
        status: 'aguardando_inicio',
      })
      .returning();

    if (!demanda) {
      throw new Error('Failed to insert demanda armazenagem');
    }

    const allItens: ReturnType<typeof mapItemArmazenagemRow>[] = [];

    if (input.demanda.tarefas && input.demanda.tarefas.length > 0) {
      for (const tarefaInput of input.demanda.tarefas) {
        const [tarefa] = await tx
          .insert(tarefasArmazenagem)
          .values({
            demandaId: demanda.id,
            unitizadorId: tarefaInput.unitizadorId,
            sequencia: tarefaInput.sequencia,
            enderecoSugeridoId: tarefaInput.enderecoSugeridoId ?? null,
            status: 'pendente',
          })
          .returning();

        if (!tarefa) {
          throw new Error('Failed to insert tarefa armazenagem');
        }

        const itemRows = await tx
          .insert(itensArmazenagem)
          .values(
            tarefaInput.itens.map((item) => ({
              demandaId: demanda.id,
              tarefaId: tarefa.id,
              unitizadorId: tarefaInput.unitizadorId,
              produtoId: item.produtoId,
              quantidade: String(item.quantidade),
              unidadeMedida: item.unidadeMedida,
              lote: item.lote,
              validade: item.validade,
              numeroSerie: item.numeroSerie,
              statusSaldo: item.statusSaldo ?? 'liberado',
              enderecoSugeridoId: tarefaInput.enderecoSugeridoId ?? null,
              status: 'pendente' as const,
            })),
          )
          .returning();

        allItens.push(...itemRows.map((row) => mapItemArmazenagemRow(row)));
      }
    }

    if (input.demanda.itens && input.demanda.itens.length > 0) {
      const itemRows = await tx
        .insert(itensArmazenagem)
        .values(
          input.demanda.itens.map((item) => ({
            demandaId: demanda.id,
            unitizadorId: item.unitizadorId,
            produtoId: item.produtoId,
            quantidade: String(item.quantidade),
            unidadeMedida: item.unidadeMedida,
            lote: item.lote,
            validade: item.validade,
            numeroSerie: item.numeroSerie,
            statusSaldo: item.statusSaldo ?? 'liberado',
            enderecoSugeridoId: item.enderecoSugeridoId ?? null,
            status: 'pendente' as const,
          })),
        )
        .returning();

      allItens.push(...itemRows.map((row) => mapItemArmazenagemRow(row)));
    }

    return {
      ...mapDemandaArmazenagemRow(demanda),
      itens: allItens,
      tarefas: [],
    };
  });
}
