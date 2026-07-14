import { and, eq } from 'drizzle-orm';

import type {
  CriarApoioRecebimentoInput,
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
import {
  ALOCACAO_RECEBIMENTO_RETURNING,
  mapAlocacaoRecebimentoRow,
} from './map-alocacao-recebimento.drizzle.js';

const SITUACOES_APOIO = new Set(['liberado_para_conferencia', 'em_conferencia']);

export async function criarApoioRecebimentoDb(
  db: DrizzleClient,
  input: CriarApoioRecebimentoInput,
): Promise<RecebimentoAlocacaoRecord> {
  const [preRecebimento] = await db
    .select({ id: preRecebimentos.id, situacao: preRecebimentos.situacao })
    .from(preRecebimentos)
    .where(eq(preRecebimentos.id, input.preRecebimentoId))
    .limit(1);

  if (!preRecebimento) {
    throw new Error('Pré-recebimento não encontrado');
  }

  if (!SITUACOES_APOIO.has(preRecebimento.situacao)) {
    throw new Error(
      'Só é possível adicionar apoio a demandas liberadas ou em conferência',
    );
  }

  const [recebimento] = await db
    .select({ id: recebimentos.id, responsavelId: recebimentos.responsavelId })
    .from(recebimentos)
    .where(eq(recebimentos.preRecebimentoId, input.preRecebimentoId))
    .limit(1);

  if (recebimento && recebimento.responsavelId === input.funcionarioId) {
    throw new Error('O responsável da carga não pode ser adicionado como apoio');
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
    throw new Error('A sessão precisa estar aberta para adicionar apoio');
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

  const status = recebimento ? 'iniciada' : 'atribuida';

  const [created] = await db
    .insert(recebimentoAlocacoes)
    .values({
      preRecebimentoId: input.preRecebimentoId,
      sessaoId: input.sessaoId,
      sessaoFuncionarioId: input.sessaoFuncionarioId,
      funcionarioId: input.funcionarioId,
      atribuidoPorUserId: input.atribuidoPorUserId,
      papel: 'apoio',
      status,
      inicioEm: recebimento ? new Date() : null,
    })
    .returning(ALOCACAO_RECEBIMENTO_RETURNING);

  if (!created) {
    throw new Error('Falha ao criar apoio');
  }

  return mapAlocacaoRecebimentoRow(created);
}
