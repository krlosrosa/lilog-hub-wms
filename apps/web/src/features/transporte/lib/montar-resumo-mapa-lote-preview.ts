import type { GerarMapasResponse, MapaLoteResumo } from '@/features/transporte/lib/gerar-mapas-api';
import type {
  ConfigMapaImpressao,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

function resolverTransporteId(
  rotaCabecalho: string,
  transportes: TransporteGrupo[],
): string | null {
  const match = transportes.find((transporte) => transporte.rota === rotaCabecalho);
  return match?.id ?? null;
}

export function montarResumoMapaLotePreview(input: {
  gruposGerados: GerarMapasResponse;
  config: ConfigMapaImpressao;
  transportes: TransporteGrupo[];
}): MapaLoteResumo {
  const transportesResumo = new Map<string, MapaLoteResumo['transportes'][number]>();

  input.transportes.forEach((transporte) => {
    transportesResumo.set(transporte.id, {
      transporteId: transporte.id,
      rota: transporte.rota,
      placa: transporte.veiculoAlocado?.placa ?? null,
      mapaGeradoEmAnterior: transporte.mapaGeradoEm ?? null,
      totalGrupos: 0,
      totalItens: 0,
      pesoTotalKg: 0,
      grupos: [],
    });
  });

  input.gruposGerados.grupos.forEach((grupo) => {
    const transporteId = resolverTransporteId(
      grupo.cabecalho.transporte,
      input.transportes,
    );

    if (!transporteId) {
      return;
    }

    const atual =
      transportesResumo.get(transporteId) ??
      ({
        transporteId,
        rota: grupo.cabecalho.transporte,
        placa: grupo.cabecalho.placa,
        mapaGeradoEmAnterior: null,
        totalGrupos: 0,
        totalItens: 0,
        pesoTotalKg: 0,
        grupos: [],
      } satisfies MapaLoteResumo['transportes'][number]);

    atual.totalGrupos += 1;
    atual.totalItens += grupo.totalItens;
    atual.pesoTotalKg += grupo.pesoTotal;
    atual.grupos.push({
      microUuid: grupo.cabecalho.microUuid,
      titulo: grupo.titulo,
      totalItens: grupo.totalItens,
      pesoTotalKg: grupo.pesoTotal,
    });

    transportesResumo.set(transporteId, atual);
  });

  const totalItens = input.gruposGerados.grupos.reduce(
    (acc, grupo) => acc + grupo.totalItens,
    0,
  );
  const pesoTotalKg = input.gruposGerados.grupos.reduce(
    (acc, grupo) => acc + grupo.pesoTotal,
    0,
  );

  return {
    totalTransportes: input.transportes.length,
    totalGrupos: input.gruposGerados.totalGrupos,
    totalItens,
    pesoTotalKg,
    transportes: Array.from(transportesResumo.values()),
    configResumo: {
      tipoDadosBasicos: input.config.tipoDadosBasicos,
      segregarPaleteFull: input.config.segregarPaleteFull,
      segregarUnidade: input.config.segregarUnidade,
      quebraPaleteAtivo: input.config.quebraPalete.ativo,
    },
  };
}

export function transportesComMapaAnterior(
  transportes: TransporteGrupo[],
): TransporteGrupo[] {
  return transportes.filter(
    (transporte) =>
      transporte.ultimoMapaLoteId != null || transporte.mapaGeradoEm != null,
  );
}
