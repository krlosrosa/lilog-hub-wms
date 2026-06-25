export type PlacaTransportadora = {
  id: string;
  transportadoraId: string;
  idRavexVeiculo: number;
  placa: string;
  tipoVeiculoIdRavex: number | null;
  tipoVeiculoNome: string | null;
  peso: string | null;
  cubagem: string | null;
  tara: string | null;
  estrangeiro: boolean;
  perfilTarifaId: string | null;
  perfilTarifaNome: string | null;
  transportadoraNome?: string;
  createdAt: string;
  updatedAt: string;
};

export type ListPlacasResponse = {
  items: PlacaTransportadora[];
  total: number;
  page: number;
  limit: number;
};

export type SincronizarPlacasResponse = ListPlacasResponse & {
  inseridas: number;
  atualizadas: number;
  removidas: number;
};

export const PLACAS_PAGE_SIZE = 50;
export const TODAS_TRANSPORTADORAS_ID = '__all__';
export const TODOS_TIPOS_VEICULO_ID = '__all_types__';

export function formatPlacaDecimal(
  value: string | null | undefined,
  fractionDigits = 2,
): string {
  if (value == null || value === '') {
    return '—';
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(parsed);
}
