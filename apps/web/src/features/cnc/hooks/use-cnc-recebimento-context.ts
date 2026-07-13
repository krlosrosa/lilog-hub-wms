'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import {
  compareChecklistPhotos,
  resolveChecklistPhotoLabel,
} from '@/features/recebimento/lib/checklist-photo-label';
import { alocarFotosPorAvaria } from '@/features/recebimento/lib/enrich-conferencia-avarias';
import { mapChecklistToInspecao } from '@/features/recebimento/lib/map-recebimento-detalhe';
import {
  fetchChecklist,
  fetchTemperaturasProduto,
  getDocumentDownloadUrl,
  listAvariaDocumentos,
  listAvarias,
  listChecklistDocumentos,
} from '@/features/recebimento/lib/recebimento-api';
import type {
  FotoEvidencia,
  InspecaoTermica,
} from '@/features/recebimento/types/recebimento-detalhe.schema';

export type CncRecebimentoContext = {
  isLoading: boolean;
  error: string | null;
  inspecao: InspecaoTermica | null;
  fotosChecklist: FotoEvidencia[];
  fotoTotalInformado: number;
  fotosPorReferencia: Map<string, FotoEvidencia[]>;
};

const EMPTY_CONTEXT: CncRecebimentoContext = {
  isLoading: false,
  error: null,
  inspecao: null,
  fotosChecklist: [],
  fotoTotalInformado: 0,
  fotosPorReferencia: new Map(),
};

export function useCncRecebimentoContext(cnc: CncDetalhe | null) {
  const [context, setContext] = useState<CncRecebimentoContext>({
    ...EMPTY_CONTEXT,
    isLoading: Boolean(cnc?.origem === 'recebimento'),
  });

  const recebimentoId =
    cnc?.origem === 'recebimento' ? cnc.origemId : null;

  const divergenciasCount = useMemo(
    () =>
      cnc?.itens.filter((item) => item.tipo === 'divergencia').length ?? 0,
    [cnc?.itens],
  );

  const carregar = useCallback(async () => {
    if (!recebimentoId || !cnc) {
      setContext(EMPTY_CONTEXT);
      return;
    }

    setContext((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const [checklist, temperaturasResponse, documentosChecklist, documentosAvaria, avarias] =
        await Promise.all([
          fetchChecklist(recebimentoId),
          fetchTemperaturasProduto(recebimentoId),
          listChecklistDocumentos(recebimentoId),
          listAvariaDocumentos(recebimentoId),
          listAvarias(recebimentoId),
        ]);

      const documentosChecklistOrdenados = [...documentosChecklist].sort(
        (a, b) => compareChecklistPhotos(a.nome, b.nome),
      );

      const fotosChecklist = await Promise.all(
        documentosChecklistOrdenados.map(async (documento) => ({
          id: documento.id,
          legenda: resolveChecklistPhotoLabel(documento.nome),
          url: await getDocumentDownloadUrl(documento.id),
        })),
      );

      const fotoTotalInformado = Math.max(
        checklist?.photoCount ?? 0,
        fotosChecklist.length,
      );

      const fotosPorDocumento = new Map(
        await Promise.all(
          documentosAvaria.map(async (documento, index) => {
            const foto: FotoEvidencia = {
              id: documento.id,
              legenda: `Evidência ${index + 1}`,
              url: await getDocumentDownloadUrl(documento.id),
            };

            return [documento.id, foto] as const;
          }),
        ),
      );

      const fotosPorReferencia = alocarFotosPorAvaria(
        avarias,
        documentosAvaria,
        fotosPorDocumento,
      );

      setContext({
        isLoading: false,
        error: null,
        inspecao: mapChecklistToInspecao(
          checklist,
          divergenciasCount,
          temperaturasResponse.items,
        ),
        fotosChecklist,
        fotoTotalInformado,
        fotosPorReferencia,
      });
    } catch (error) {
      setContext({
        ...EMPTY_CONTEXT,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o checklist do recebimento.',
      });
    }
  }, [cnc, divergenciasCount, recebimentoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return context;
}
