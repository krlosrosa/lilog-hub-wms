import type { SessaoOrigemApoioOption } from '@/features/gestao-recursos/components/adicionar-apoio-sheet';
import type {
  FuncionarioApoioCandidatoApi,
  SessaoApi,
} from '@/features/gestao-recursos/types/gestao-recursos.api';

function formatSessaoOrigemLabel(sessao: SessaoApi): string {
  const data = new Date(sessao.dataReferencia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  return `${sessao.equipeNome} · ${data}`;
}

function buildSessoesAbertasIndex(
  todasSessoesAbertas: SessaoApi[],
): Map<string, SessaoApi> {
  return new Map(
    todasSessoesAbertas
      .filter((sessao) => sessao.status === 'aberta')
      .map((sessao) => [sessao.id, sessao]),
  );
}

export function filterCandidatosDeSessoesAbertas(
  candidatos: FuncionarioApoioCandidatoApi[],
  todasSessoesAbertas: SessaoApi[],
): FuncionarioApoioCandidatoApi[] {
  const sessoesAbertas = buildSessoesAbertasIndex(todasSessoesAbertas);

  return candidatos.filter((candidato) =>
    sessoesAbertas.has(candidato.sessaoOrigemId),
  );
}

/**
 * Monta opções de filtro por sessão de origem a partir dos candidatos reais
 * e do catálogo de sessões abertas da unidade (todos os setores).
 * Sessões encerradas são ignoradas.
 */
export function buildSessoesOrigemApoioOptions(
  candidatos: FuncionarioApoioCandidatoApi[],
  todasSessoesAbertas: SessaoApi[],
): SessaoOrigemApoioOption[] {
  const sessoesAbertas = buildSessoesAbertasIndex(todasSessoesAbertas);
  const candidatosAbertos = filterCandidatosDeSessoesAbertas(
    candidatos,
    todasSessoesAbertas,
  );

  if (candidatosAbertos.length === 0) {
    return [];
  }

  const optionsBySessaoId = new Map<string, SessaoOrigemApoioOption>();

  for (const candidato of candidatosAbertos) {
    if (optionsBySessaoId.has(candidato.sessaoOrigemId)) {
      continue;
    }

    const sessaoOrigem = sessoesAbertas.get(candidato.sessaoOrigemId);
    if (!sessaoOrigem) {
      continue;
    }

    optionsBySessaoId.set(candidato.sessaoOrigemId, {
      id: candidato.sessaoOrigemId,
      label: formatSessaoOrigemLabel(sessaoOrigem),
    });
  }

  return [...optionsBySessaoId.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR'),
  );
}
