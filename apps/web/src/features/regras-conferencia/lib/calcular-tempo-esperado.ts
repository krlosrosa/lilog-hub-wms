import type { RegraConferenciaForm } from '@/features/regras-conferencia/types/regra-conferencia.schema';

type ParametrosConferencia = Pick<
  RegraConferenciaForm,
  | 'gorduraInicioMapaSeg'
  | 'tempoPrimeiroItemSeg'
  | 'tempoDemaisItensSeg'
  | 'tempoPorPaleteSeg'
  | 'tempoPorClienteSeg'
  | 'gorduraFimMapaSeg'
>;

export function calcularTempoConferenciaSeg(
  params: ParametrosConferencia,
  qtdLinhas: number,
  qtdPaletes: number,
  qtdClientes: number,
): number {
  const linhas = Math.max(0, qtdLinhas);
  const paletes = Math.max(0, qtdPaletes);
  const clientes = Math.max(0, qtdClientes);

  const tempoLinhas =
    linhas > 0
      ? params.tempoPrimeiroItemSeg +
        Math.max(0, linhas - 1) * params.tempoDemaisItensSeg
      : 0;

  const tempoPaletes = paletes * params.tempoPorPaleteSeg;
  const tempoClientes =
    clientes > 1 ? (clientes - 1) * params.tempoPorClienteSeg : 0;

  return (
    params.gorduraInicioMapaSeg +
    tempoLinhas +
    tempoPaletes +
    tempoClientes +
    params.gorduraFimMapaSeg
  );
}
