import type { CreateEscalaInput } from '../../../domain/model/sessao-operacao/sessao-operacao.model.js';
import type { EscalaDetailRecord } from '../../../domain/repositories/sessao-operacao/sessao-operacao.repository.js';
import {
  inferCruzaMeiaNoite,
  validarHorariosEscala,
} from '../../../domain/services/sessao-operacao/janela-turno.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  equipes,
  escalasTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';
import { findEscalaByIdDb } from './find-escala.drizzle.js';

function normalizeHorario(value: string): string {
  const parts = value.split(':');
  const hours = parts[0]?.padStart(2, '0') ?? '00';
  const minutes = parts[1]?.padStart(2, '0') ?? '00';
  const seconds = parts[2]?.padStart(2, '0') ?? '00';
  return `${hours}:${minutes}:${seconds}`;
}

export async function createEscalaComEquipeDb(
  db: DrizzleClient,
  input: CreateEscalaInput,
): Promise<EscalaDetailRecord> {
  validarHorariosEscala(input.horaInicio, input.horaFim);
  const cruzaMeiaNoite = inferCruzaMeiaNoite(input.horaInicio, input.horaFim);

  return db.transaction(async (tx) => {
    const [equipe] = await tx
      .insert(equipes)
      .values({
        unidadeId: input.unidadeId,
        nome: input.nomeEquipe,
        area: input.area ?? null,
        ativo: true,
      })
      .returning({ id: equipes.id });

    if (!equipe) {
      throw new Error('Failed to create equipe');
    }

    const [escala] = await tx
      .insert(escalasTrabalho)
      .values({
        unidadeId: input.unidadeId,
        equipeId: equipe.id,
        nome: input.nomeEscala,
        horaInicioPlanejada: normalizeHorario(input.horaInicio),
        horaFimPlanejada: normalizeHorario(input.horaFim),
        cruzaMeiaNoite,
        ativo: true,
      })
      .returning({ id: escalasTrabalho.id });

    if (!escala) {
      throw new Error('Failed to create escala');
    }

    const created = await findEscalaByIdDb(tx, escala.id);
    if (!created) {
      throw new Error('Failed to load created escala');
    }

    return created;
  });
}
