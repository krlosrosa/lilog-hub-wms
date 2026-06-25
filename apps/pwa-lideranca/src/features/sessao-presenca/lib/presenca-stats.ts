import type { PresencaStats, SessaoFuncionarioApi } from '../types';

export function calcularPresencaStats(
  funcionarios: SessaoFuncionarioApi[],
): PresencaStats {
  const total = funcionarios.length;
  const presentes = funcionarios.filter(
    (f) => f.status === 'presente' || f.status === 'atraso',
  ).length;
  const faltas = funcionarios.filter(
    (f) => f.status === 'falta' || f.status === 'atestado',
  ).length;
  const pendentes = funcionarios.filter((f) => f.status === 'esperado').length;

  return {
    total,
    presentes,
    pendentes,
    faltas,
    percentPresentes: total > 0 ? Math.round((presentes / total) * 100) : 0,
  };
}

export function filtrarFuncionarios(
  funcionarios: SessaoFuncionarioApi[],
  filtro: 'pendentes' | 'todos' | 'presentes' | 'faltas',
  busca: string,
): SessaoFuncionarioApi[] {
  const term = busca.toLowerCase().trim();

  let list = funcionarios;

  switch (filtro) {
    case 'pendentes':
      list = list.filter((f) => f.status === 'esperado');
      break;
    case 'presentes':
      list = list.filter(
        (f) => f.status === 'presente' || f.status === 'atraso',
      );
      break;
    case 'faltas':
      list = list.filter(
        (f) =>
          f.status === 'falta' ||
          f.status === 'atestado' ||
          f.status === 'folga',
      );
      break;
    default:
      break;
  }

  if (term) {
    list = list.filter(
      (f) =>
        f.nome.toLowerCase().includes(term) ||
        f.matricula.toLowerCase().includes(term) ||
        f.cargo.toLowerCase().includes(term),
    );
  }

  return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function sortSessoesByPriority<T extends { status: string }>(
  sessoes: T[],
): T[] {
  const order: Record<string, number> = {
    aberta: 0,
    planejada: 1,
    encerrada: 2,
    cancelada: 3,
  };

  return [...sessoes].sort(
    (a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99),
  );
}
