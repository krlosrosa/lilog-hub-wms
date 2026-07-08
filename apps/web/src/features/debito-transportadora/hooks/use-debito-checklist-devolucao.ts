'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  buscarDemandaDevolucao,
  getDocumentDownloadUrl,
  listChecklistDevolucaoDocumentos,
} from '@/features/devolucao/lib/devolucao-api';
import type { DevolucaoChecklistDetalhe } from '@/features/devolucao/types/devolucao-buscar.schema';
import type { ChecklistFoto } from '@/features/devolucao/types/devolucao-checklist.schema';
import {
  compareChecklistPhotos,
  resolveChecklistPhotoLabel,
} from '@/features/recebimento/lib/checklist-photo-label';

export function useDebitoChecklistDevolucao(
  demandaId: string,
  unidadeId: string | null,
) {
  const [checklist, setChecklist] = useState<DevolucaoChecklistDetalhe | null>(
    null,
  );
  const [fotos, setFotos] = useState<ChecklistFoto[]>([]);
  const [fotoTotalInformado, setFotoTotalInformado] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const carregarChecklistFotos = useCallback(async (demandaIdParam: string) => {
    try {
      const documentos = await listChecklistDevolucaoDocumentos(demandaIdParam);
      const sorted = [...documentos].sort((a, b) =>
        compareChecklistPhotos(a.nome, b.nome),
      );

      const fotosResolvidas = await Promise.all(
        sorted.map(async (documento) => ({
          id: documento.id,
          legenda: resolveChecklistPhotoLabel(documento.nome),
          url: await getDocumentDownloadUrl(documento.id),
        })),
      );

      setFotos(fotosResolvidas);
      setFotoTotalInformado((prev) => Math.max(prev, fotosResolvidas.length));
    } catch {
      setFotos([]);
    }
  }, []);

  const carregar = useCallback(async () => {
    if (!unidadeId || !demandaId) {
      setChecklist(null);
      setFotos([]);
      setFotoTotalInformado(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await buscarDemandaDevolucao(demandaId, unidadeId);
      setChecklist(response.checklist);
      setFotoTotalInformado(response.checklist?.photoCount ?? 0);

      await carregarChecklistFotos(demandaId);
    } catch {
      setChecklist(null);
      setFotos([]);
      setFotoTotalInformado(0);
    } finally {
      setIsLoading(false);
    }
  }, [carregarChecklistFotos, demandaId, unidadeId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return {
    checklist,
    fotos,
    fotoTotalInformado,
    isLoading,
  };
}
