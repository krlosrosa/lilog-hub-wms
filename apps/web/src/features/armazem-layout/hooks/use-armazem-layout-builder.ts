'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useUnidadeContext } from '@/contexts/unidade-context';
import {
  getArmazemLayout,
  getArmazemLayoutOcupacao,
  mapArmazemLayoutApiToWarehouseLayout,
  saveArmazemLayout,
  vincularArmazemLayoutSlotEndereco,
  type ArmazemLayoutOcupacaoApi,
  type ArmazemLayoutSlotApi,
} from '@/features/armazem-layout/api';
import {
  DEFAULT_LAYOUT_NAME,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEP,
} from '@/features/armazem-layout/constants';
import {
  clearLayout,
  downloadLayoutJson,
  loadLayout,
  parseImportedLayoutJson,
  saveLayout,
} from '@/features/armazem-layout/storage/armazem-layout-storage';
import type {
  BuilderTool,
  LayoutElement,
  WarehouseLayout,
} from '@/features/armazem-layout/types';
import {
  canPlaceElement,
  clampToGrid,
  createElementAt,
  createEmptyLayout,
} from '@/features/armazem-layout/utils/grid';

type ElementPatch = Partial<
  Pick<LayoutElement, 'label' | 'gw' | 'gh' | 'levels' | 'zona'>
>;

const SAVE_DEBOUNCE_MS = 800;

export function useArmazemLayoutBuilder() {
  const { unidadeSelecionada } = useUnidadeContext();
  const unidadeId = unidadeSelecionada?.id;

  const [layout, setLayout] = useState<WarehouseLayout>(() => createEmptyLayout());
  const [tool, setTool] = useState<BuilderTool>('selecionar');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [hydrated, setHydrated] = useState(false);
  const [viewMode, setViewMode] = useState<'editar' | 'ocupacao'>('editar');
  const [ocupacao, setOcupacao] = useState<ArmazemLayoutOcupacaoApi | null>(null);
  const [slots, setSlots] = useState<ArmazemLayoutSlotApi[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [linkingSlotId, setLinkingSlotId] = useState<string | null>(null);
  const [slotLinkError, setSlotLinkError] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSaveRef = useRef(false);

  const persistRemote = useCallback(
    async (nextLayout: WarehouseLayout) => {
      if (!unidadeId) return;

      setIsSaving(true);
      setSaveError(null);

      try {
        const saved = await saveArmazemLayout({
          unidadeId,
          name: nextLayout.name,
          gridCols: nextLayout.gridCols,
          gridRows: nextLayout.gridRows,
          elements: nextLayout.elements,
        });
        setSlots(saved.slots);
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : 'Falha ao salvar layout no servidor',
        );
      } finally {
        setIsSaving(false);
      }
    },
    [unidadeId],
  );

  const scheduleSave = useCallback(
    (nextLayout: WarehouseLayout) => {
      saveLayout(nextLayout);

      if (!unidadeId) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        void persistRemote(nextLayout);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistRemote, unidadeId],
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrateLayout() {
      if (!unidadeId) {
        const stored = loadLayout();
        if (stored) setLayout(stored);
        setHydrated(true);
        return;
      }

      try {
        const remote = await getArmazemLayout(unidadeId);
        if (cancelled) return;

        if (remote) {
          skipNextSaveRef.current = true;
          setLayout(mapArmazemLayoutApiToWarehouseLayout(remote));
          setSlots(remote.slots);
        } else {
          const stored = loadLayout();
          if (stored) setLayout(stored);
          setSlots([]);
        }
      } catch {
        const stored = loadLayout();
        if (!cancelled && stored) setLayout(stored);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    setHydrated(false);
    void hydrateLayout();

    return () => {
      cancelled = true;
    };
  }, [unidadeId]);

  useEffect(() => {
    if (!hydrated || skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    scheduleSave(layout);
  }, [layout, hydrated, scheduleSave]);

  useEffect(() => {
    if (viewMode !== 'ocupacao' || !unidadeId) {
      setOcupacao(null);
      return;
    }

    let cancelled = false;

    void getArmazemLayoutOcupacao(unidadeId)
      .then((data) => {
        if (!cancelled) setOcupacao(data);
      })
      .catch(() => {
        if (!cancelled) setOcupacao(null);
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode, unidadeId, layout.elements.length, layout.name]);

  const selectedElement = useMemo(
    () => layout.elements.find((element) => element.id === selectedId) ?? null,
    [layout.elements, selectedId],
  );

  const updateLayout = useCallback(
    (updater: (prev: WarehouseLayout) => WarehouseLayout) => {
      setLayout(updater);
    },
    [],
  );

  const placeElementAt = useCallback(
    (gx: number, gy: number) => {
      if (tool === 'selecionar' || viewMode === 'ocupacao') return;

      const element = createElementAt(tool, gx, gy, layout.elements);
      const clamped = clampToGrid(
        element.gx,
        element.gy,
        element.gw,
        element.gh,
        layout.gridCols,
        layout.gridRows,
      );

      const candidate = { ...element, ...clamped };
      if (!canPlaceElement(candidate, layout.elements, layout.gridCols, layout.gridRows)) {
        return;
      }

      updateLayout((prev) => ({
        ...prev,
        elements: [...prev.elements, candidate],
      }));
      setSelectedId(candidate.id);
      setTool('selecionar');
    },
    [layout.elements, layout.gridCols, layout.gridRows, tool, updateLayout, viewMode],
  );

  const moveElement = useCallback(
    (id: string, gx: number, gy: number) => {
      if (viewMode === 'ocupacao') return;

      updateLayout((prev) => {
        const current = prev.elements.find((element) => element.id === id);
        if (!current) return prev;

        const clamped = clampToGrid(
          gx,
          gy,
          current.gw,
          current.gh,
          prev.gridCols,
          prev.gridRows,
        );
        const candidate = { ...current, ...clamped };

        if (
          !canPlaceElement(candidate, prev.elements, prev.gridCols, prev.gridRows, id)
        ) {
          return prev;
        }

        return {
          ...prev,
          elements: prev.elements.map((element) =>
            element.id === id ? candidate : element,
          ),
        };
      });
    },
    [updateLayout, viewMode],
  );

  const updateElement = useCallback(
    (id: string, patch: ElementPatch) => {
      if (viewMode === 'ocupacao') return;

      updateLayout((prev) => {
        const current = prev.elements.find((element) => element.id === id);
        if (!current) return prev;

        const next = { ...current, ...patch };
        if (
          !canPlaceElement(next, prev.elements, prev.gridCols, prev.gridRows, id)
        ) {
          return prev;
        }

        return {
          ...prev,
          elements: prev.elements.map((element) =>
            element.id === id ? next : element,
          ),
        };
      });
    },
    [updateLayout, viewMode],
  );

  const removeElement = useCallback(
    (id: string) => {
      if (viewMode === 'ocupacao') return;

      updateLayout((prev) => ({
        ...prev,
        elements: prev.elements.filter((element) => element.id !== id),
      }));
      setSelectedId((current) => (current === id ? null : current));
    },
    [updateLayout, viewMode],
  );

  const clearAll = useCallback(() => {
    if (viewMode === 'ocupacao') return;

    const empty = createEmptyLayout();
    setLayout(empty);
    setSelectedId(null);
    clearLayout();
    void persistRemote(empty);
  }, [persistRemote, viewMode]);

  const setLayoutName = useCallback(
    (name: string) => {
      if (viewMode === 'ocupacao') return;

      updateLayout((prev) => ({
        ...prev,
        name: name.trim() || DEFAULT_LAYOUT_NAME,
      }));
    },
    [updateLayout, viewMode],
  );

  const selectElement = useCallback((id: string | null) => {
    setSelectedId(id);
    setTool('selecionar');
  }, []);

  const zoomIn = useCallback(() => {
    setZoomPercent((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomPercent((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
  }, []);

  const exportJson = useCallback(() => {
    downloadLayoutJson(layout);
  }, [layout]);

  const importJson = useCallback(async (file: File) => {
    const raw = await file.text();
    const imported = parseImportedLayoutJson(raw);
    setLayout(imported);
    setSelectedId(null);
    setTool('selecionar');
  }, []);

  const setActiveTool = useCallback(
    (nextTool: BuilderTool) => {
      if (viewMode === 'ocupacao') return;

      setTool(nextTool);
      if (nextTool !== 'selecionar') {
        setSelectedId(null);
      }
    },
    [viewMode],
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((current) => (current === 'editar' ? 'ocupacao' : 'editar'));
    setTool('selecionar');
    setSelectedId(null);
  }, []);

  const vincularSlotEndereco = useCallback(
    async (slotId: string, enderecoId: string | null) => {
      if (!unidadeId) return;

      setLinkingSlotId(slotId);
      setSlotLinkError(null);

      try {
        const updated = await vincularArmazemLayoutSlotEndereco(slotId, enderecoId);
        setSlots((current) =>
          current.map((slot) => (slot.id === updated.id ? updated : slot)),
        );
      } catch (error) {
        setSlotLinkError(
          error instanceof Error ? error.message : 'Falha ao vincular endereço',
        );
      } finally {
        setLinkingSlotId(null);
      }
    },
    [unidadeId],
  );

  return {
    layout,
    tool,
    selectedId,
    selectedElement,
    zoomPercent,
    hydrated,
    viewMode,
    ocupacao,
    slots,
    isSaving,
    saveError,
    linkingSlotId,
    slotLinkError,
    unidadeId,
    placeElementAt,
    moveElement,
    updateElement,
    removeElement,
    clearAll,
    setLayoutName,
    selectElement,
    setActiveTool,
    zoomIn,
    zoomOut,
    exportJson,
    importJson,
    toggleViewMode,
    vincularSlotEndereco,
  };
}

export type UseArmazemLayoutBuilderReturn = ReturnType<
  typeof useArmazemLayoutBuilder
>;
