import type { Veiculo } from '../types/manobra.schema';

export type VeiculoComPosicao = Veiculo & { posicao: number };

export type FilaDoca = {
  doca: string;
  veiculos: VeiculoComPosicao[];
};

function docaNumero(doca: string): number {
  const match = doca.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function porAtribuicao(a: Veiculo, b: Veiculo): number {
  const tempoA = a.atribuidoEm ? new Date(a.atribuidoEm).getTime() : 0;
  const tempoB = b.atribuidoEm ? new Date(b.atribuidoEm).getTime() : 0;
  return tempoA - tempoB;
}

export function ordenarPendentes(veiculos: Veiculo[]): Veiculo[] {
  return [...veiculos].filter((v) => v.status === 'pendente').sort(porAtribuicao);
}

export function obterProximoVeiculo(veiculos: Veiculo[]): Veiculo | null {
  const pendentes = ordenarPendentes(veiculos);
  return pendentes[0] ?? null;
}

export function agruparFilasPorDoca(veiculos: Veiculo[]): FilaDoca[] {
  const pendentes = ordenarPendentes(veiculos);
  const porDoca = new Map<string, Veiculo[]>();

  for (const veiculo of pendentes) {
    const fila = porDoca.get(veiculo.doca) ?? [];
    fila.push(veiculo);
    porDoca.set(veiculo.doca, fila);
  }

  return Array.from(porDoca.entries())
    .map(([doca, fila]) => ({
      doca,
      veiculos: fila.sort(porAtribuicao).map((veiculo, index) => ({
        ...veiculo,
        posicao: index + 1,
      })),
    }))
    .sort((a, b) => docaNumero(a.doca) - docaNumero(b.doca));
}
