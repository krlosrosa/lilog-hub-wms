import { and, eq } from 'drizzle-orm';

import type {
  CriarAlocacaoDevolucaoInput,
  DevolucaoAlocacaoRecord,
} from '../../../domain/repositories/devolucao/devolucao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  demandasDevolucao,
  devolucaoAlocacoes,
} from '../providers/drizzle/config/migrations/schema.js';
import {
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';

export async function criarAlocacaoDevolucaoDb(
  db: DrizzleClient,
  input: CriarAlocacaoDevolucaoInput,
): Promise<DevolucaoAlocacaoRecord> {
  const [demanda] = await db
    .select({ id: demandasDevolucao.id })
    .from(demandasDevolucao)
    .where(
      and(
        eq(demandasDevolucao.id, input.demandaId),
        eq(demandasDevolucao.unidadeId, input.unidadeId),
      ),
    )
    .limit(1);

  if (!demanda) {
    throw new Error('Demanda de devolução não encontrada para a unidade');
  }

  const [sessao] = await db
    .select({ id: sessoesTrabalho.id })
    .from(sessoesTrabalho)
    .where(
      and(
        eq(sessoesTrabalho.id, input.sessaoId),
        eq(sessoesTrabalho.unidadeId, input.unidadeId),
      ),
    )
    .limit(1);

  if (!sessao) {
    throw new Error('Sessão não encontrada para a unidade');
  }

  const [sessaoFuncionario] = await db
    .select({ id: sessaoFuncionarios.id })
    .from(sessaoFuncionarios)
    .where(
      and(
        eq(sessaoFuncionarios.id, input.sessaoFuncionarioId),
        eq(sessaoFuncionarios.sessaoId, input.sessaoId),
      ),
    )
    .limit(1);

  if (!sessaoFuncionario) {
    throw new Error('Funcionário não pertence à sessão informada');
  }

  const [existing] = await db
    .select({ id: devolucaoAlocacoes.id })
    .from(devolucaoAlocacoes)
    .where(
      and(
        eq(devolucaoAlocacoes.demandaId, input.demandaId),
        eq(devolucaoAlocacoes.sessaoFuncionarioId, input.sessaoFuncionarioId),
        eq(devolucaoAlocacoes.status, 'em_andamento'),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error('Operador já alocado nesta demanda de devolução');
  }

  const [created] = await db
    .insert(devolucaoAlocacoes)
    .values({
      demandaId: input.demandaId,
      sessaoId: input.sessaoId,
      sessaoFuncionarioId: input.sessaoFuncionarioId,
      funcao: input.funcao ?? 'conferente',
      status: 'em_andamento',
      inicioEm: new Date(),
    })
    .returning({
      id: devolucaoAlocacoes.id,
      demandaId: devolucaoAlocacoes.demandaId,
      sessaoId: devolucaoAlocacoes.sessaoId,
      sessaoFuncionarioId: devolucaoAlocacoes.sessaoFuncionarioId,
      funcao: devolucaoAlocacoes.funcao,
      status: devolucaoAlocacoes.status,
      atribuidoEm: devolucaoAlocacoes.atribuidoEm,
      inicioEm: devolucaoAlocacoes.inicioEm,
      fimEm: devolucaoAlocacoes.fimEm,
    });

  if (!created) {
    throw new Error('Falha ao criar alocação de devolução');
  }

  return created;
}
