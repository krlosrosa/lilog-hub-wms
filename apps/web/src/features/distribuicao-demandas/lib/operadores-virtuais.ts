import type { Operador } from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

export function criarOperadoresVirtuais(qtdFuncionarios: number): Operador[] {
  const qtd = Math.max(1, qtdFuncionarios);
  const qtdSeparadores = Math.max(1, Math.ceil(qtd * 0.7));
  const qtdConferentes = Math.max(1, qtd - qtdSeparadores);

  const operadores: Operador[] = [];

  for (let i = 0; i < qtdSeparadores; i++) {
    operadores.push({
      id: `virt-sep-${i + 1}`,
      sessaoFuncionarioId: `virt-sep-${i + 1}`,
      nome: `Separador ${i + 1}`,
      cargo: 'Separador',
      funcao: 'separador',
      empresa: '—',
      statusPresenca: 'presente',
      capacidadeKgH: 450,
      cargaAtualPercent: 0,
      produtividadeMedia: 85,
    });
  }

  for (let i = 0; i < qtdConferentes; i++) {
    operadores.push({
      id: `virt-conf-${i + 1}`,
      sessaoFuncionarioId: `virt-conf-${i + 1}`,
      nome: `Conferente ${i + 1}`,
      cargo: 'Conferente',
      funcao: 'conferente',
      empresa: '—',
      statusPresenca: 'presente',
      capacidadeKgH: 480,
      cargaAtualPercent: 0,
      produtividadeMedia: 90,
    });
  }

  return operadores;
}
