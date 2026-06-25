import { inferirPerfilEsperado } from '@/features/transporte/lib/inferir-perfil-esperado';
import type {
  RemessaItem,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

function somarPeso(remessas: RemessaItem[]): number {
  return remessas.reduce((acc, remessa) => acc + remessa.peso, 0);
}

function somarVolume(remessas: RemessaItem[]): number {
  return (
    Math.round(remessas.reduce((acc, remessa) => acc + remessa.volume, 0) * 10) /
    10
  );
}

export function recalcularTotaisTransporte(
  remessas: RemessaItem[],
): Pick<
  TransporteGrupo,
  'quantidadeRemessas' | 'pesoTotal' | 'volumeTotal' | 'perfilEsperado'
> {
  const pesoTotal = somarPeso(remessas);
  const volumeTotal = somarVolume(remessas);

  return {
    quantidadeRemessas: remessas.length,
    pesoTotal,
    volumeTotal,
    perfilEsperado: inferirPerfilEsperado(pesoTotal, volumeTotal),
  };
}

export function mesclarRemessasNoTransporte(
  transporte: TransporteGrupo,
  novasRemessas: RemessaItem[],
): TransporteGrupo {
  const remessas = [...transporte.remessas, ...novasRemessas];

  return {
    ...transporte,
    remessas,
    ...recalcularTotaisTransporte(remessas),
  };
}
