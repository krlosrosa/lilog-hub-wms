import {
  mapearVeiculoRoteirizado,
  normalizarPlaca,
} from '@/features/transporte/lib/parse-roteirizacao-xlsx';
import type { PerfilTarifaItem } from '@/features/transporte/types/perfil-tarifa.schema';
import type { PlacaTransportadora } from '@/features/transporte/types/placa-transportadora.schema';
import type {
  TipoVeiculo,
  Veiculo,
  VeiculoAlocado,
} from '@/features/transporte/types/transporte.schema';

export function buildPerfilTarifaMap(
  perfis: PerfilTarifaItem[],
): Map<string, PerfilTarifaItem> {
  return new Map(perfis.map((perfil) => [perfil.id, perfil]));
}

export function buildPlacaCadastroMap(
  placas: PlacaTransportadora[],
): Map<string, PlacaTransportadora> {
  const map = new Map<string, PlacaTransportadora>();

  for (const placa of placas) {
    const chave = normalizarPlaca(placa.placa);
    if (!chave || map.has(chave)) {
      continue;
    }

    map.set(chave, placa);
  }

  return map;
}

function resolverTipoVeiculoPlaca(
  placa: PlacaTransportadora,
  perfilTarifaNome?: string | null,
): TipoVeiculo | null {
  if (perfilTarifaNome?.trim()) {
    const fromPerfil = mapearVeiculoRoteirizado(perfilTarifaNome);
    if (fromPerfil) {
      return fromPerfil;
    }
  }

  return mapearVeiculoRoteirizado(placa.tipoVeiculoNome);
}

export function mapPlacaToVeiculo(
  placa: PlacaTransportadora,
  perfisPorId: Map<string, PerfilTarifaItem>,
): Veiculo | null {
  if (!placa.perfilTarifaId || !placa.perfilTarifaNome?.trim()) {
    return null;
  }

  return mapPlacaCadastroToVeiculo(placa, perfisPorId);
}

export function mapPlacaCadastroToVeiculo(
  placa: PlacaTransportadora,
  perfisPorId: Map<string, PerfilTarifaItem>,
): Veiculo {
  const perfilTarifaNome = placa.perfilTarifaNome?.trim() || null;
  const tipo = resolverTipoVeiculoPlaca(placa, perfilTarifaNome) ?? 'Toco';
  const perfil = placa.perfilTarifaId
    ? perfisPorId.get(placa.perfilTarifaId)
    : undefined;

  return {
    id: placa.id,
    placa: normalizarPlaca(placa.placa),
    transportadora: placa.transportadoraNome?.trim() ?? '',
    modelo: perfilTarifaNome ?? placa.tipoVeiculoNome?.trim() ?? '—',
    ano: 0,
    tipo,
    perfilTarifaId: placa.perfilTarifaId,
    perfilTarifaNome,
    capacidadePeso: perfil?.peso ?? Number(placa.peso ?? 0),
    capacidadeVolume: perfil?.cubagem ?? Number(placa.cubagem ?? 0),
    motorista: '',
    cnhCategoria: '',
    ultimaManutencao: '',
    proximaRevisao: '',
    tipoFrete: 'fracionado',
    pesoAlocado: 0,
    disponivel: true,
  };
}

export function mapPlacasToVeiculos(
  placas: PlacaTransportadora[],
  perfisPorId: Map<string, PerfilTarifaItem>,
): Veiculo[] {
  return placas
    .map((placa) => mapPlacaToVeiculo(placa, perfisPorId))
    .filter((veiculo): veiculo is Veiculo => veiculo !== null);
}

export function mapAllPlacasToVeiculos(
  placas: PlacaTransportadora[],
  perfisPorId: Map<string, PerfilTarifaItem>,
): Veiculo[] {
  return placas.map((placa) => mapPlacaCadastroToVeiculo(placa, perfisPorId));
}

export function buildVeiculoAlocadoFromVeiculo(veiculo: Veiculo): VeiculoAlocado {
  return {
    veiculoId: veiculo.id,
    placa: veiculo.placa,
    tipo: veiculo.tipo,
    motorista: veiculo.motorista,
    transportadora: veiculo.transportadora,
    perfilTarifaId: veiculo.perfilTarifaId ?? null,
    perfilTarifaNome: veiculo.perfilTarifaNome ?? null,
  };
}

export function resolverVeiculoParaAlocacao(
  placaNormalizada: string,
  placasCadastro: Map<string, PlacaTransportadora>,
  perfisPorId: Map<string, PerfilTarifaItem>,
): {
  veiculo: Veiculo | null;
  motivoFalha: 'nao_cadastrada' | 'sem_perfil_tarifa' | 'perfil_nao_mapeado' | null;
} {
  const placaRegistro = placasCadastro.get(placaNormalizada);

  if (!placaRegistro) {
    return { veiculo: null, motivoFalha: 'nao_cadastrada' };
  }

  if (!placaRegistro.perfilTarifaId || !placaRegistro.perfilTarifaNome?.trim()) {
    return { veiculo: null, motivoFalha: 'sem_perfil_tarifa' };
  }

  const veiculo = mapPlacaToVeiculo(placaRegistro, perfisPorId);

  if (!veiculo) {
    return { veiculo: null, motivoFalha: 'perfil_nao_mapeado' };
  }

  return { veiculo, motivoFalha: null };
}
