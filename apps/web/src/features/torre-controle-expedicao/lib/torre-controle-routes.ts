import { persistUploadLoteAtivo } from '@/features/expedicao/storage/upload-lote-ativo-storage';
import type { IntervaloData } from '@/features/torre-controle-expedicao/lib/intervalo-data';
import { persistTorreControleFiltro } from '@/features/torre-controle-expedicao/storage/torre-controle-filtro-storage';

export const TORRE_CONTROLE_EXPEDICAO_PATH = '/expedicao/torre-controle';

export function buildTorreControleExpedicaoHref(
  uploadLoteId: string,
  unidadeId?: string,
  intervalo?: IntervaloData,
): string {
  if (unidadeId) {
    persistUploadLoteAtivo(unidadeId, uploadLoteId);

    if (intervalo) {
      persistTorreControleFiltro(unidadeId, {
        ...intervalo,
        uploadLoteId,
      });
    }
  }

  return TORRE_CONTROLE_EXPEDICAO_PATH;
}
export function resolverUploadLoteIdTransportes(
  transportes: ReadonlyArray<{ uploadLoteId?: string | null }>,
): string | null {
  if (transportes.length === 0) {
    return null;
  }

  const contagem = new Map<string, number>();

  for (const transporte of transportes) {
    if (!transporte.uploadLoteId) {
      continue;
    }

    contagem.set(
      transporte.uploadLoteId,
      (contagem.get(transporte.uploadLoteId) ?? 0) + 1,
    );
  }

  if (contagem.size === 0) {
    return null;
  }

  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}
