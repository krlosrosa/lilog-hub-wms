import type {
  GerarMapasConfigInput,
  GerarMapasResponse,
} from '../../dtos/expedicao/gerar-mapas.dto.js';
import type { MapaLoteResumo } from '../../dtos/expedicao/salvar-mapas.dto.js';
import type { TransporteMapaContext } from './montar-mapas-de-transportes.js';

function resolverTransporteId(
  rotaCabecalho: string,
  transportes: TransporteMapaContext[],
  transportesPorRota: Map<string, string>,
): string | null {
  const byRota = transportesPorRota.get(rotaCabecalho);
  if (byRota) {
    return byRota;
  }

  const match = transportes.find((transporte) => transporte.rota === rotaCabecalho);
  return match?.id ?? null;
}

export function montarResumoMapaLote(input: {
  payload: GerarMapasResponse;
  config: GerarMapasConfigInput;
  transportes: TransporteMapaContext[];
  transportesPorRota: Map<string, string>;
}): MapaLoteResumo {
  const transportesResumo = new Map<
    string,
    MapaLoteResumo['transportes'][number]
  >();

  input.transportes.forEach((transporte) => {
    transportesResumo.set(transporte.id, {
      transporteId: transporte.id,
      rota: transporte.rota,
      placa: transporte.placa,
      mapaGeradoEmAnterior: transporte.mapaGeradoEm?.toISOString() ?? null,
      totalGrupos: 0,
      totalItens: 0,
      pesoTotalKg: 0,
      grupos: [],
    });
  });

  input.payload.grupos.forEach((grupo) => {
    const transporteId = resolverTransporteId(
      grupo.cabecalho.transporte,
      input.transportes,
      input.transportesPorRota,
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

  input.payload.carregamento?.minutas.forEach((minuta) => {
    const transporteId = minuta.transporteId;
    const totalLinhasResumo =
      minuta.tabelaEmpresa.length + minuta.tabelaClientes.length;

    const atual =
      transportesResumo.get(transporteId) ??
      ({
        transporteId,
        rota: minuta.cabecalho.transporte,
        placa: minuta.cabecalho.placa,
        mapaGeradoEmAnterior: null,
        totalGrupos: 0,
        totalItens: 0,
        pesoTotalKg: 0,
        grupos: [],
      } satisfies MapaLoteResumo['transportes'][number]);

    atual.totalGrupos += 1;
    atual.totalItens += totalLinhasResumo;
    atual.pesoTotalKg += minuta.totais.pesoKg;
    atual.grupos.push({
      microUuid: minuta.cabecalho.microUuid,
      titulo: minuta.cabecalho.transporte,
      totalItens: totalLinhasResumo,
      pesoTotalKg: minuta.totais.pesoKg,
    });

    transportesResumo.set(transporteId, atual);
  });

  const transportesLista = Array.from(transportesResumo.values());
  const totalItens = input.payload.grupos.reduce(
    (acc, grupo) => acc + grupo.totalItens,
    0,
  );
  const pesoTotalKg = input.payload.grupos.reduce(
    (acc, grupo) => acc + grupo.pesoTotal,
    0,
  );

  return {
    totalTransportes: input.transportes.length,
    totalGrupos:
      input.payload.totalGrupos +
      (input.payload.conferencia?.totalGrupos ?? 0) +
      (input.payload.carregamento?.totalMinutas ?? 0),
    totalItens,
    pesoTotalKg,
    transportes: transportesLista,
    configResumo: {
      tipoDadosBasicos: input.config.tipoDadosBasicos,
      segregarPaleteFull: input.config.segregarPaleteFull,
      segregarUnidade: input.config.segregarUnidade,
      quebraPaleteAtivo: input.config.quebraPalete.ativo,
    },
  };
}
