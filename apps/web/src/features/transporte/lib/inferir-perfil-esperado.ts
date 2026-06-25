import type { TipoVeiculo } from '@/features/transporte/types/transporte.schema';

export function inferirPerfilEsperado(
  pesoTotal: number,
  volumeTotal: number,
): TipoVeiculo {
  if (pesoTotal <= 1200 && volumeTotal <= 8) {
    return 'VUC';
  }

  if (pesoTotal <= 3500 && volumeTotal <= 18) {
    return 'Truck_3_4';
  }

  if (pesoTotal <= 10000 && volumeTotal <= 45) {
    return 'Carreta';
  }

  return 'Bitrem';
}
