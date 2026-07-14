import { and, eq, isNull, inArray } from 'drizzle-orm';

import type {
  CriarAlocacaoRecebimentoInput,
  RecebimentoAlocacaoRecord,
} from '../../../domain/repositories/recebimento/recebimento-alocacao.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { funcionarios } from '../providers/drizzle/config/schemas/auth.schema.js';
import {
  preRecebimentos,
  recebimentoAlocacoes,
  recebimentos,
  sessaoFuncionarios,
  sessoesTrabalho,
} from '../providers/drizzle/config/migrations/schema.js';

export async function criarAlocacaoRecebimentoDb(
  db: DrizzleClient,
  input: CriarAlocacaoRecebimentoInput,
): Promise<RecebimentoAlocacaoRecord> {
  const [preRecebimento] = await db
    .select({ id: preRecebimentos.id, situacao: preRecebimentos.situacao })
    .from(preRecebimentos)
    .where(eq(preRecebimentos.id, input.preRecebimentoId))
    .limit(1);

  if (!preRecebimento) {
    throw new Error('Pré-recebimento não encontrado');
  }

  if (preRecebimento.situacao !== 'liberado_para_conferencia') {
    throw new Error(
      'Só é possível atribuir conferente a pré-recebimentos liberados para conferência',
    );
  }

  const [recebimentoExistente] = await db
    .select({ id: recebimentos.id })
    .from(recebimentos)
    .where(eq(recebimentos.preRecebimentoId, input.preRecebimentoId))
    .limit(1);

  if (recebimentoExistente) {
    throw new Error('Este pré-recebimento já foi iniciado');
  }

  const [sessao] = await db
    .select({ id: sessoesTrabalho.id, status: sessoesTrabalho.status })
    .from(sessoesTrabalho)
    .where(eq(sessoesTrabalho.id, input.sessaoId))
    .limit(1);

  if (!sessao) {
    throw new Error('Sessão não encontrada');
  }

  if (sessao.status !== 'aberta') {
    throw new Error('A sessão precisa estar aberta para realizar atribuições');
  }

  const [sessaoFuncionario] = await db
    .select({ id: sessaoFuncionarios.id, status: sessaoFuncionarios.status })
    .from(sessaoFuncionarios)
    .where(
      and(
        eq(sessaoFuncionarios.id, input.sessaoFuncionarioId),
        eq(sessaoFuncionarios.sessaoId, input.sessaoId),
      ),
    )
    .limit(1);

  if (!sessaoFuncionario) {
    throw new Error('Funcionário não pertence a esta sessão');
  }

  if (
    sessaoFuncionario.status !== 'presente' &&
    sessaoFuncionario.status !== 'atraso'
  ) {
    throw new Error('Funcionário não está presente na sessão');
  }

  const [funcionario] = await db
    .select({ id: funcionarios.id })
    .from(funcionarios)
    .where(eq(funcionarios.id, input.funcionarioId))
    .limit(1);

  if (!funcionario) {
    throw new Error('Funcionário não encontrado');
  }

  const [created] = await db
    .insert(recebimentoAlocacoes)
    .values({
      preRecebimentoId: input.preRecebimentoId,
      sessaoId: input.sessaoId,
      sessaoFuncionarioId: input.sessaoFuncionarioId,
      funcionarioId: input.funcionarioId,
      atribuidoPorUserId: input.atribuidoPorUserId,
      status: 'atribuida',
    })
    .returning({
      id: recebimentoAlocacoes.id,
      preRecebimentoId: recebimentoAlocacoes.preRecebimentoId,
      sessaoId: recebimentoAlocacoes.sessaoId,
      sessaoFuncionarioId: recebimentoAlocacoes.sessaoFuncionarioId,
      funcionarioId: recebimentoAlocacoes.funcionarioId,
      status: recebimentoAlocacoes.status,
      atribuidoEm: recebimentoAlocacoes.atribuidoEm,
      inicioEm: recebimentoAlocacoes.inicioEm,
      canceladoEm: recebimentoAlocacoes.canceladoEm,
    });

  if (!created) {
    throw new Error('Falha ao criar alocação');
  }

  return created;
}

export async function findAlocacaoAtivaByPreRecebimentoIdDb(
  db: DrizzleClient,
  preRecebimentoId: string,
): Promise<RecebimentoAlocacaoRecord | null> {
  const [row] = await db
    .select({
      id: recebimentoAlocacoes.id,
      preRecebimentoId: recebimentoAlocacoes.preRecebimentoId,
      sessaoId: recebimentoAlocacoes.sessaoId,
      sessaoFuncionarioId: recebimentoAlocacoes.sessaoFuncionarioId,
      funcionarioId: recebimentoAlocacoes.funcionarioId,
      status: recebimentoAlocacoes.status,
      atribuidoEm: recebimentoAlocacoes.atribuidoEm,
      inicioEm: recebimentoAlocacoes.inicioEm,
      canceladoEm: recebimentoAlocacoes.canceladoEm,
    })
    .from(recebimentoAlocacoes)
    .where(
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, preRecebimentoId),
        eq(recebimentoAlocacoes.status, 'atribuida'),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function marcarAlocacaoIniciadaDb(
  db: DrizzleClient,
  preRecebimentoId: string,
): Promise<void> {
  await db
    .update(recebimentoAlocacoes)
    .set({ status: 'iniciada', inicioEm: new Date() })
    .where(
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, preRecebimentoId),
        eq(recebimentoAlocacoes.status, 'atribuida'),
      ),
    );
}

export type CriarAlocacaoIniciadaRetroativaInput = {
  preRecebimentoId: string;
  sessaoId: string;
  sessaoFuncionarioId: string;
  funcionarioId: number;
  inicioEm: Date;
};

export async function criarAlocacaoIniciadaRetroativaDb(
  db: DrizzleClient,
  input: CriarAlocacaoIniciadaRetroativaInput,
): Promise<RecebimentoAlocacaoRecord> {
  const [existing] = await db
    .select({ id: recebimentoAlocacoes.id })
    .from(recebimentoAlocacoes)
    .where(
      and(
        eq(recebimentoAlocacoes.preRecebimentoId, input.preRecebimentoId),
        inArray(recebimentoAlocacoes.status, ['atribuida', 'iniciada']),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error('Alocação ativa já existe para este pré-recebimento');
  }

  const [created] = await db
    .insert(recebimentoAlocacoes)
    .values({
      preRecebimentoId: input.preRecebimentoId,
      sessaoId: input.sessaoId,
      sessaoFuncionarioId: input.sessaoFuncionarioId,
      funcionarioId: input.funcionarioId,
      status: 'iniciada',
      inicioEm: input.inicioEm,
      atribuidoEm: input.inicioEm,
    })
    .returning({
      id: recebimentoAlocacoes.id,
      preRecebimentoId: recebimentoAlocacoes.preRecebimentoId,
      sessaoId: recebimentoAlocacoes.sessaoId,
      sessaoFuncionarioId: recebimentoAlocacoes.sessaoFuncionarioId,
      funcionarioId: recebimentoAlocacoes.funcionarioId,
      status: recebimentoAlocacoes.status,
      atribuidoEm: recebimentoAlocacoes.atribuidoEm,
      inicioEm: recebimentoAlocacoes.inicioEm,
      canceladoEm: recebimentoAlocacoes.canceladoEm,
    });

  if (!created) {
    throw new Error('Falha ao criar alocação retroativa');
  }

  return created;
}
