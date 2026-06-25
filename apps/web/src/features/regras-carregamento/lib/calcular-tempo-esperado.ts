import type { RegraCarregamentoForm } from '@/features/regras-carregamento/types/regra-carregamento.schema';

type ParametrosCarregamento = Pick<
  RegraCarregamentoForm,
  | 'gorduraInicioMinutaSeg'
  | 'tempoPrimeiroPaleteSeg'
  | 'tempoDemaisPaletesSeg'
  | 'tempoPorClienteSeg'
  | 'tempoPorTabelaSeg'
  | 'deslocamentoInternoDocaSeg'
  | 'tempoAmarracaoMinutaSeg'
  | 'gorduraFimMinutaSeg'
>;

export function calcularTempoCarregamentoSeg(
  params: ParametrosCarregamento,
  qtdPaletes: number,
  qtdClientes: number,
  qtdTabelas: number,
): number {
  const paletes = Math.max(0, qtdPaletes);
  const clientes = Math.max(0, qtdClientes);
  const tabelas = Math.max(0, qtdTabelas);

  const tempoPaletes =
    paletes > 0
      ? params.tempoPrimeiroPaleteSeg +
        Math.max(0, paletes - 1) * params.tempoDemaisPaletesSeg
      : 0;

  const tempoClientes =
    clientes > 1 ? (clientes - 1) * params.tempoPorClienteSeg : 0;

  const tempoTabelas = tabelas * params.tempoPorTabelaSeg;

  return (
    params.gorduraInicioMinutaSeg +
    tempoPaletes +
    tempoClientes +
    tempoTabelas +
    params.deslocamentoInternoDocaSeg +
    params.tempoAmarracaoMinutaSeg +
    params.gorduraFimMinutaSeg
  );
}
