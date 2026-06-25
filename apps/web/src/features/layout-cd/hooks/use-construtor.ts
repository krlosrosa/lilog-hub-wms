'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  MOCK_INITIAL_HIERARCHY,
  MOCK_PARTS_LIBRARY,
} from '@/features/layout-cd/mocks/layout-cd.mock';
import {
  loadPublishedLayout,
  saveLayoutFromHierarchy,
} from '@/features/layout-cd/storage/layout-cd-layout-storage';
import {
  cabecaFormSchema,
  componentFormSchema,
  rackConfigFormSchema,
  streetFormSchema,
  structureFormSchema,
  type CabecaEnd,
  type CabecaForm,
  type ComponentForm,
  type WarehousePosition,
  type LayoutHierarchy,
  type LayoutSelection,
  type RackConfigForm,
  type RackType,
  type StreetForm,
  type StreetType,
  type StructureForm,
} from '@/features/layout-cd/types/layout-cd.schema';
import { canvasItemsToHierarchy } from '@/features/layout-cd/utils/canvas-to-hierarchy';
import {
  addComponentToStructure,
  addStreetToHierarchy,
  addStructureToStreet,
  canPublishLayout,
  countStorageComponents,
  findOrCreateStreetForRack,
  isRackCompatibleWithStreet,
  rackTypeToStreetType,
  rackTypeToStructureKind,
  removeNodeFromHierarchy,
  resolveSelection,
  sideForNewStructure,
  streetTypeLabel,
  updateComponentInHierarchy,
  updateStreetInHierarchy,
  updateStructureInHierarchy,
} from '@/features/layout-cd/utils/layout-hierarchy-ops';
import { snapToGrid } from '@/features/layout-cd/utils/builder-grid';
import { positionToSelection } from '@/features/layout-cd/utils/layout-preview-utils';
import { migrateHierarchyCabecas } from '@/features/layout-cd/utils/migrate-hierarchy-cabecas';
import {
  addCabecaToHierarchy,
  addComponentToCabecaStructure,
  addStructureToCabeca,
  updateCabecaInHierarchy,
  updateComponentInCabeca,
  updateStructureInCabeca,
  warehouseStreetIds,
} from '@/features/layout-cd/utils/layout-cabeca-ops';
import {
  normalizeComponentForm,
  sanitizeHierarchyLabels,
} from '@/features/layout-cd/utils/normalize-component-form';

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

const DEFAULT_CONFIG: RackConfigForm = {
  heightPerLevelMm: 2200,
  positionsPerLevel: 3,
  capacityKg: 1200,
  storageLogic: 'fefo',
  rackType: 'porta-palete',
  activeLevel: 3,
};

function loadInitialHierarchy(): LayoutHierarchy {
  const published = loadPublishedLayout();
  let base: LayoutHierarchy;
  if (published?.hierarchy) {
    base = published.hierarchy;
  } else if (published?.canvasItems?.length) {
    base = canvasItemsToHierarchy(published.canvasItems);
  } else {
    base = MOCK_INITIAL_HIERARCHY;
  }
  return sanitizeHierarchyLabels(migrateHierarchyCabecas(base));
}

function partLabelForType(type: RackType): string {
  const part = MOCK_PARTS_LIBRARY.find((p) => p.type === type);
  return part?.name ?? type;
}

export function useConstrutor() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<LayoutHierarchy>(loadInitialHierarchy);
  const [selection, setSelection] = useState<LayoutSelection | null>(() => {
    const h = loadInitialHierarchy();
    const first = h.streets[0];
    return first
      ? { level: 'street', streetId: first.id }
      : null;
  });
  const [expandedStreetIds, setExpandedStreetIds] = useState<Set<string>>(
    () => new Set(loadInitialHierarchy().streets.map((s) => s.id)),
  );
  const [expandedStructureIds, setExpandedStructureIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedCabecaIds, setExpandedCabecaIds] = useState<Set<string>>(
    () => new Set(),
  );
  /** Última peça clicada na biblioteca — usada em + Corredor / + Estrutura / + Posição. */
  const [activePartType, setActivePartType] = useState<RackType>('porta-palete');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isPublishing, setIsPublishing] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [propertiesDialogOpen, setPropertiesDialogOpen] = useState(false);

  const resolved = useMemo(
    () => resolveSelection(hierarchy, selection),
    [hierarchy, selection],
  );

  const {
    street: selectedStreet,
    cabeca: selectedCabeca,
    structure: selectedStructure,
    component: selectedComponent,
  } = resolved;

  const floorPressurePercent = useMemo(() => {
    const base = 20 + hierarchy.streets.length * 5;
    const levels = selectedComponent?.loadLevels ?? selectedStructure?.components.length ?? 4;
    return Math.min(95, base + levels * 4);
  }, [hierarchy.streets.length, selectedComponent, selectedStructure]);

  const streetForm = useForm<StreetForm>({
    resolver: zodResolver(streetFormSchema),
    defaultValues: { code: 'RUA-01', name: 'Corredor', type: 'corredor-armazem' },
  });

  const structureForm = useForm<StructureForm>({
    resolver: zodResolver(structureFormSchema),
    defaultValues: {
      code: 'EST-01',
      label: 'Estrutura',
      kind: 'lado-estante',
      rackType: 'porta-palete',
      side: 1,
    },
  });

  const cabecaForm = useForm<CabecaForm>({
    resolver: zodResolver(cabecaFormSchema),
    defaultValues: {
      code: 'CAB-01',
      name: 'Transversal',
      end: 'fim',
      streetIds: [],
    },
  });

  const componentForm = useForm<ComponentForm>({
    resolver: zodResolver(componentFormSchema),
    defaultValues: {
      code: 'P01',
      label: '',
      kind: 'posicao-armazenagem',
      loadLevels: 4,
      capacityTon: 1.2,
      depthMm: 800,
    },
  });

  const configForm = useForm<RackConfigForm>({
    resolver: zodResolver(rackConfigFormSchema),
    defaultValues: DEFAULT_CONFIG,
  });

  const syncStreetForm = useCallback(
    (data: StreetForm) => {
      if (!selection?.streetId) return;
      setHierarchy((prev) => {
        const street = prev.streets.find((s) => s.id === selection.streetId);
        if (!street) return prev;

        let next = updateStreetInHierarchy(prev, selection.streetId!, data);

        if (data.type === 'zona-drive-in') {
          next = {
            ...next,
            streets: next.streets.map((s) => {
              if (s.id !== selection.streetId) return s;
              return {
                ...s,
                structures: s.structures.map((st) =>
                  st.rackType === 'drive-in' && st.kind === 'lado-estante'
                    ? {
                        ...st,
                        kind: 'bloco-drive-in' as const,
                        side: undefined,
                      }
                    : st,
                ),
              };
            }),
          };
        }

        return next;
      });
    },
    [selection?.streetId],
  );

  const syncCabecaForm = useCallback(
    (data: CabecaForm) => {
      if (!selection?.cabecaId) return;
      setHierarchy((prev) =>
        updateCabecaInHierarchy(prev, selection.cabecaId!, data),
      );
    },
    [selection?.cabecaId],
  );

  const syncStructureForm = useCallback(
    (data: StructureForm) => {
      if (!selection?.structureId) return;
      const rackType = data.rackType ?? 'porta-palete';
      const kind = rackTypeToStructureKind(rackType);
      const patch = {
        ...data,
        kind,
        rackType: ['porta-palete', 'drive-in', 'flow-rack'].includes(rackType)
          ? rackType
          : undefined,
      };

      if (selection.cabecaId) {
        setHierarchy((prev) =>
          updateStructureInCabeca(
            prev,
            selection.cabecaId!,
            selection.structureId!,
            {
              ...patch,
              anchorStreetId: data.anchorStreetId,
            },
          ),
        );
        return;
      }

      if (!selection.streetId) return;
      setHierarchy((prev) =>
        updateStructureInHierarchy(prev, selection.streetId!, selection.structureId!, {
          ...patch,
          side: kind === 'lado-estante' ? (data.side ?? 1) : undefined,
        }),
      );
    },
    [selection],
  );

  const syncComponentForm = useCallback(
    (data: ComponentForm) => {
      if (!selection?.structureId || !selection.componentId) return;
      const normalized = normalizeComponentForm(data);

      if (selection.cabecaId) {
        setHierarchy((prev) =>
          updateComponentInCabeca(
            prev,
            selection.cabecaId!,
            selection.structureId!,
            selection.componentId!,
            normalized,
          ),
        );
        return;
      }

      if (!selection.streetId) return;
      setHierarchy((prev) =>
        updateComponentInHierarchy(
          prev,
          selection.streetId!,
          selection.structureId!,
          selection.componentId!,
          normalized,
        ),
      );
    },
    [selection],
  );

  const applyPropertiesFromForms = useCallback(() => {
    if (!selection) return;

    if (selection.level === 'street') {
      syncStreetForm(streetForm.getValues());
    } else if (selection.level === 'cabeca') {
      syncCabecaForm(cabecaForm.getValues());
    } else if (selection.level === 'structure' && selection.structureId) {
      syncStructureForm(structureForm.getValues());
    } else if (
      selection.level === 'component' &&
      selection.structureId &&
      selection.componentId
    ) {
      syncComponentForm(componentForm.getValues());
    }
  }, [
    selection,
    streetForm,
    structureForm,
    componentForm,
    syncStreetForm,
    syncCabecaForm,
    syncStructureForm,
    syncComponentForm,
  ]);

  useEffect(() => {
    if (propertiesDialogOpen) return;
    if (selectedStreet && selection?.level === 'street') {
      streetForm.reset({
        code: selectedStreet.code,
        name: selectedStreet.name,
        type: selectedStreet.type,
      });
    }
  }, [selectedStreet, selection?.level, propertiesDialogOpen, streetForm]);

  useEffect(() => {
    if (propertiesDialogOpen) return;
    if (selectedStructure && selection?.level === 'structure') {
      structureForm.reset({
        code: selectedStructure.code,
        label: selectedStructure.label,
        kind: selectedStructure.kind,
        rackType: selectedStructure.rackType,
        side: selectedStructure.side,
        anchorStreetId: selectedStructure.anchorStreetId,
      });
    }
  }, [selectedStructure, selection?.level, propertiesDialogOpen, structureForm]);

  useEffect(() => {
    if (propertiesDialogOpen) return;
    if (selectedCabeca && selection?.level === 'cabeca') {
      cabecaForm.reset({
        code: selectedCabeca.code,
        name: selectedCabeca.name,
        end: selectedCabeca.end,
        streetIds: selectedCabeca.streetIds,
      });
    }
  }, [selectedCabeca, selection?.level, propertiesDialogOpen, cabecaForm]);

  useEffect(() => {
    if (propertiesDialogOpen) return;
    if (selectedComponent && selection?.level === 'component') {
      componentForm.reset({
        code: selectedComponent.code,
        label: selectedComponent.label,
        kind: selectedComponent.kind,
        loadLevels: selectedComponent.loadLevels,
        capacityTon: selectedComponent.capacityTon,
        depthMm: selectedComponent.depthMm,
      });
      configForm.reset(selectedComponent.config);
    }
  }, [
    selectedComponent,
    selection?.level,
    propertiesDialogOpen,
    componentForm,
    configForm,
  ]);

  useEffect(() => {
    if (!propertiesDialogOpen || !selection) return;

    if (selection.level === 'street') {
      const subscription = streetForm.watch((data) => {
        syncStreetForm(data as StreetForm);
      });
      return () => subscription.unsubscribe();
    }

    if (selection.level === 'cabeca') {
      const subscription = cabecaForm.watch((data) => {
        syncCabecaForm(data as CabecaForm);
      });
      return () => subscription.unsubscribe();
    }

    if (selection.level === 'structure' && selection.structureId) {
      const subscription = structureForm.watch((data) => {
        syncStructureForm(data as StructureForm);
      });
      return () => subscription.unsubscribe();
    }

    if (
      selection.level === 'component' &&
      selection.structureId &&
      selection.componentId
    ) {
      const subscription = componentForm.watch((data) => {
        syncComponentForm(normalizeComponentForm(data as ComponentForm));
      });
      return () => subscription.unsubscribe();
    }

    return undefined;
  }, [
    propertiesDialogOpen,
    selection,
    streetForm,
    cabecaForm,
    structureForm,
    componentForm,
    syncStreetForm,
    syncCabecaForm,
    syncStructureForm,
    syncComponentForm,
  ]);

  const selectNode = useCallback(
    (sel: LayoutSelection) => {
      if (propertiesDialogOpen) {
        applyPropertiesFromForms();
      }
      setSelection(sel);
      if (sel.cabecaId) {
        setExpandedCabecaIds((prev) => new Set(prev).add(sel.cabecaId!));
        if (sel.structureId) {
          setExpandedStructureIds((prev) => new Set(prev).add(sel.structureId!));
        }
        return;
      }
      if (sel.streetId) {
        if (sel.structureId) {
          setExpandedStreetIds((prev) => new Set(prev).add(sel.streetId!));
          setExpandedStructureIds((prev) => new Set(prev).add(sel.structureId!));
        } else {
          setExpandedStreetIds((prev) => new Set(prev).add(sel.streetId!));
        }
      }
    },
    [propertiesDialogOpen, applyPropertiesFromForms],
  );

  const toggleCabecaExpanded = useCallback((cabecaId: string) => {
    setExpandedCabecaIds((prev) => {
      const next = new Set(prev);
      if (next.has(cabecaId)) next.delete(cabecaId);
      else next.add(cabecaId);
      return next;
    });
  }, []);

  const toggleStreetExpanded = useCallback((streetId: string) => {
    setExpandedStreetIds((prev) => {
      const next = new Set(prev);
      if (next.has(streetId)) next.delete(streetId);
      else next.add(streetId);
      return next;
    });
  }, []);

  const toggleStructureExpanded = useCallback((structureId: string) => {
    setExpandedStructureIds((prev) => {
      const next = new Set(prev);
      if (next.has(structureId)) next.delete(structureId);
      else next.add(structureId);
      return next;
    });
  }, []);

  const expandAllHierarchy = useCallback(() => {
    setExpandedStreetIds(new Set(hierarchy.streets.map((s) => s.id)));
    setExpandedCabecaIds(new Set(hierarchy.cabecas.map((c) => c.id)));
    setExpandedStructureIds(
      new Set([
        ...hierarchy.streets.flatMap((s) => s.structures.map((st) => st.id)),
        ...hierarchy.cabecas.flatMap((c) => c.structures.map((st) => st.id)),
      ]),
    );
  }, [hierarchy]);

  const collapseAllHierarchy = useCallback(() => {
    setExpandedStreetIds(new Set());
    setExpandedCabecaIds(new Set());
    setExpandedStructureIds(new Set());
  }, []);

  const collapseSelection = useCallback(() => {
    if (!selection) {
      collapseAllHierarchy();
      return;
    }
    if (selection.cabecaId) {
      if (selection.level === 'component' || selection.level === 'structure') {
        if (selection.structureId) {
          setExpandedStructureIds((prev) => {
            const next = new Set(prev);
            next.delete(selection.structureId!);
            return next;
          });
        }
        return;
      }
      setExpandedCabecaIds((prev) => {
        const next = new Set(prev);
        next.delete(selection.cabecaId!);
        return next;
      });
      return;
    }
    if (selection.level === 'component' && selection.structureId) {
      setExpandedStructureIds((prev) => {
        const next = new Set(prev);
        next.delete(selection.structureId!);
        return next;
      });
      return;
    }
    if (selection.level === 'structure' && selection.structureId) {
      setExpandedStructureIds((prev) => {
        const next = new Set(prev);
        next.delete(selection.structureId!);
        return next;
      });
      return;
    }
    if (selection.level === 'street' && selection.streetId) {
      setExpandedStreetIds((prev) => {
        const next = new Set(prev);
        next.delete(selection.streetId!);
        return next;
      });
    }
  }, [selection, collapseAllHierarchy]);

  const [hierarchyPanelCollapsed, setHierarchyPanelCollapsed] = useState(false);

  const toggleHierarchyPanelCollapsed = useCallback(() => {
    setHierarchyPanelCollapsed((prev) => !prev);
  }, []);

  const addStreet = useCallback((type: StreetType, x?: number, y?: number) => {
    const px = snapToGrid(x ?? 80 + hierarchy.streets.length * 80);
    const py = snapToGrid(y ?? 80);
    const { hierarchy: next, streetId } = addStreetToHierarchy(hierarchy, type, px, py);
    setHierarchy(next);
    setExpandedStreetIds((prev) => new Set(prev).add(streetId));
    selectNode({ level: 'street', streetId });
    toast.success('Corredor adicionado ao layout');
  }, [hierarchy, selectNode]);

  const addStructureForPart = useCallback(
    (rackType: RackType) => {
      setActivePartType(rackType);

      let workingHierarchy = hierarchy;
      let targetStreetId: string;
      let createdStreet = false;

      const selectedStreet = selection?.streetId
        ? hierarchy.streets.find((s) => s.id === selection.streetId)
        : undefined;

      if (selectedStreet) {
        if (isRackCompatibleWithStreet(rackType, selectedStreet.type)) {
          targetStreetId = selectedStreet.id;
        } else {
          const targetType = rackTypeToStreetType(rackType);
          workingHierarchy = updateStreetInHierarchy(
            workingHierarchy,
            selectedStreet.id,
            { type: targetType },
          );
          targetStreetId = selectedStreet.id;
          toast.info(
            `${selectedStreet.code} convertida para ${streetTypeLabel(targetType)}`,
          );
        }
      } else {
        const result = findOrCreateStreetForRack(workingHierarchy, rackType);
        workingHierarchy = result.hierarchy;
        targetStreetId = result.streetId;
        createdStreet = result.created;
      }

      const targetStreet = workingHierarchy.streets.find(
        (s) => s.id === targetStreetId,
      );
      if (!targetStreet) return;

      const side = sideForNewStructure(targetStreet);
      const next = addStructureToStreet(
        workingHierarchy,
        targetStreetId,
        rackType,
        side,
      );
      setHierarchy(next);

      if (createdStreet) {
        setExpandedStreetIds((prev) => new Set(prev).add(targetStreetId));
      }

      const newStructure = next.streets
        .find((s) => s.id === targetStreetId)
        ?.structures.at(-1);

      if (newStructure) {
        selectNode({
          level: 'structure',
          streetId: targetStreetId,
          structureId: newStructure.id,
        });
      }

      const streetLabel = targetStreet.code;
      if (createdStreet) {
        toast.success(
          `${streetTypeLabel(targetStreet.type)} criada com ${partLabelForType(rackType)}`,
        );
      } else {
        toast.success(`${partLabelForType(rackType)} adicionado em ${streetLabel}`);
      }
    },
    [hierarchy, selection, selectNode],
  );

  const addComponent = useCallback(
    (rackType: RackType) => {
      if (!selection?.streetId || !selection.structureId) {
        toast.info('Selecione uma estrutura para adicionar posições');
        return;
      }
      const next = addComponentToStructure(
        hierarchy,
        selection.streetId,
        selection.structureId,
        rackType,
      );
      setHierarchy(next);
      const structure = next.streets
        .find((s) => s.id === selection.streetId)
        ?.structures.find((st) => st.id === selection.structureId);
      const newComp = structure?.components.at(-1);
      if (newComp) {
        selectNode({
          level: 'component',
          streetId: selection.streetId,
          structureId: selection.structureId,
          componentId: newComp.id,
        });
      }
      toast.success('Posição adicionada à estrutura');
    },
    [hierarchy, selection, selectNode],
  );

  const handlePartChipClick = useCallback(
    (type: RackType) => {
      setActivePartType(type);

      if (selection?.level === 'structure' && selection.structureId) {
        const street = hierarchy.streets.find((s) => s.id === selection.streetId);
        const structure = street?.structures.find(
          (st) => st.id === selection.structureId,
        );
        const isTraffic =
          structure &&
          ['faixa-pedestre', 'faixa-empilhadeira', 'barreira-seguranca'].includes(
            structure.kind,
          );
        if (structure && !isTraffic) {
          addComponent(structure.rackType ?? type);
          return;
        }
      }

      addStructureForPart(type);
    },
    [selection, hierarchy, addComponent, addStructureForPart],
  );

  const selectPositionFromPreview = useCallback(
    (position: WarehousePosition) => {
      const sel = positionToSelection(position);
      if (sel) selectNode(sel);
    },
    [selectNode],
  );

  const zoomIn = useCallback(() => {
    setZoomPercent((z) => Math.min(200, z + 10));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomPercent((z) => Math.max(50, z - 10));
  }, []);

  const removeSelected = useCallback(() => {
    if (!selection) {
      toast.info('Selecione um item para remover');
      return;
    }
    setHierarchy((prev) => removeNodeFromHierarchy(prev, selection));
    setSelection(null);
    setPropertiesDialogOpen(false);
    setConfigDialogOpen(false);
    toast.success('Item removido');
  }, [selection]);

  const updateItemConfig = useCallback(
    async (data: RackConfigForm) => {
      if (!selection?.componentId || !selection.structureId) return;
      await delay(300);
      const loadLevels = Math.min(12, Math.max(1, data.activeLevel));
      setHierarchy((prev) => {
        if (selection.cabecaId) {
          return updateComponentInCabeca(
            prev,
            selection.cabecaId,
            selection.structureId!,
            selection.componentId!,
            { config: data, loadLevels },
          );
        }
        if (!selection.streetId) return prev;
        return updateComponentInHierarchy(
          prev,
          selection.streetId,
          selection.structureId!,
          selection.componentId!,
          { config: data, loadLevels },
        );
      });
      componentForm.setValue('loadLevels', loadLevels);
      configForm.reset(data);
      setConfigDialogOpen(false);
      toast.success('Ajustes salvos');
    },
    [selection, configForm, componentForm],
  );

  const openConfigDialog = useCallback(() => {
    if (!selectedComponent) {
      toast.info('Selecione um componente (posição) para configurar níveis');
      return;
    }
    setConfigDialogOpen(true);
  }, [selectedComponent]);

  const openPropertiesDialog = useCallback(() => {
    if (!selection) {
      toast.info('Selecione um item na hierarquia');
      return;
    }
    if (selection.level === 'street' && selectedStreet) {
      streetForm.reset({
        code: selectedStreet.code,
        name: selectedStreet.name,
        type: selectedStreet.type,
      });
    } else if (selection.level === 'cabeca' && selectedCabeca) {
      cabecaForm.reset({
        code: selectedCabeca.code,
        name: selectedCabeca.name,
        end: selectedCabeca.end,
        streetIds: selectedCabeca.streetIds,
      });
    } else if (selection.level === 'structure' && selectedStructure) {
      structureForm.reset({
        code: selectedStructure.code,
        label: selectedStructure.label,
        kind: selectedStructure.kind,
        rackType: selectedStructure.rackType,
        side: selectedStructure.side,
        anchorStreetId: selectedStructure.anchorStreetId,
      });
    } else if (selection.level === 'component' && selectedComponent) {
      componentForm.reset({
        code: selectedComponent.code,
        label: selectedComponent.label,
        kind: selectedComponent.kind,
        loadLevels: selectedComponent.loadLevels,
        capacityTon: selectedComponent.capacityTon,
        depthMm: selectedComponent.depthMm,
      });
    }
    setPropertiesDialogOpen(true);
  }, [
    selection,
    selectedStreet,
    selectedCabeca,
    selectedStructure,
    selectedComponent,
    streetForm,
    cabecaForm,
    structureForm,
    componentForm,
  ]);

  const resetProperties = useCallback(() => {
    if (selection?.level === 'street' && selectedStreet) {
      streetForm.reset({
        code: selectedStreet.code,
        name: selectedStreet.name,
        type: selectedStreet.type,
      });
      syncStreetForm(streetForm.getValues());
    } else if (selection?.level === 'cabeca' && selectedCabeca) {
      cabecaForm.reset({
        code: selectedCabeca.code,
        name: selectedCabeca.name,
        end: selectedCabeca.end,
        streetIds: selectedCabeca.streetIds,
      });
      syncCabecaForm(cabecaForm.getValues());
    } else if (selection?.level === 'structure' && selectedStructure) {
      structureForm.reset({
        code: selectedStructure.code,
        label: selectedStructure.label,
        kind: selectedStructure.kind,
        rackType: selectedStructure.rackType,
        side: selectedStructure.side,
        anchorStreetId: selectedStructure.anchorStreetId,
      });
      syncStructureForm(structureForm.getValues());
    } else if (selection?.level === 'component' && selectedComponent) {
      componentForm.reset({
        code: selectedComponent.code,
        label: selectedComponent.label,
        kind: selectedComponent.kind,
        loadLevels: selectedComponent.loadLevels,
        capacityTon: selectedComponent.capacityTon,
        depthMm: selectedComponent.depthMm,
      });
      syncComponentForm(componentForm.getValues());
    }
    toast.success('Valores restaurados');
  }, [
    selection,
    selectedStreet,
    selectedStructure,
    selectedComponent,
    streetForm,
    structureForm,
    componentForm,
    syncStreetForm,
    syncCabecaForm,
    syncStructureForm,
    syncComponentForm,
  ]);

  const confirmProperties = useCallback(() => {
    applyPropertiesFromForms();
    toast.success('Propriedades aplicadas ao layout');
  }, [applyPropertiesFromForms]);

  const closeConfigDialog = useCallback(() => {
    setConfigDialogOpen(false);
  }, []);

  const handlePropertiesDialogChange = useCallback(
    (open: boolean) => {
      if (!open) {
        applyPropertiesFromForms();
      }
      setPropertiesDialogOpen(open);
    },
    [applyPropertiesFromForms],
  );

  const persistLayout = useCallback(() => {
    if (!canPublishLayout(hierarchy)) {
      toast.error(
        'Adicione estruturas com posições ou um bloco drive-in no corredor',
      );
      return false;
    }
    const count = countStorageComponents(hierarchy);
    saveLayoutFromHierarchy(hierarchy);
    return true;
  }, [hierarchy]);

  const previewArmazem = useCallback(() => {
    if (!persistLayout()) return;
    router.push('/layout-cd/armazem');
  }, [persistLayout, router]);

  const publishLayout = useCallback(async () => {
    if (!persistLayout()) return;

    setIsPublishing(true);
    await delay(600);
    setIsPublishing(false);
    toast.success('Layout publicado');
    router.push('/layout-cd/armazem');
  }, [persistLayout, router]);

  const addStructureToSelection = useCallback(() => {
    if (selection?.level === 'cabeca' && selection.cabecaId) {
      const cabeca = hierarchy.cabecas.find((c) => c.id === selection.cabecaId);
      const anchor = cabeca?.streetIds[0];
      const next = addStructureToCabeca(
        hierarchy,
        selection.cabecaId,
        activePartType,
        anchor,
      );
      setHierarchy(next);
      setExpandedCabecaIds((prev) => new Set(prev).add(selection.cabecaId!));
      const newStructure = next.cabecas
        .find((c) => c.id === selection.cabecaId)
        ?.structures.at(-1);
      if (newStructure) {
        selectNode({
          level: 'structure',
          cabecaId: selection.cabecaId,
          structureId: newStructure.id,
        });
      }
      toast.success('Estrutura adicionada à cabeceira');
      return;
    }
    addStructureForPart(activePartType);
  }, [hierarchy, selection, activePartType, addStructureForPart, selectNode]);

  const addComponentToSelection = useCallback(() => {
    if (!selection?.structureId) {
      toast.info('Selecione uma estrutura');
      return;
    }
    if (selection.cabecaId) {
      const structure = hierarchy.cabecas
        .find((c) => c.id === selection.cabecaId)
        ?.structures.find((st) => st.id === selection.structureId);
      const rackType = structure?.rackType ?? activePartType;
      const next = addComponentToCabecaStructure(
        hierarchy,
        selection.cabecaId,
        selection.structureId,
        rackType,
      );
      setHierarchy(next);
      const newComp = next.cabecas
        .find((c) => c.id === selection.cabecaId)
        ?.structures.find((st) => st.id === selection.structureId)
        ?.components.at(-1);
      if (newComp) {
        selectNode({
          level: 'component',
          cabecaId: selection.cabecaId,
          structureId: selection.structureId,
          componentId: newComp.id,
        });
      }
      toast.success('Posição adicionada à cabeceira');
      return;
    }
    if (!selection.streetId) return;
    const structure = hierarchy.streets
      .find((s) => s.id === selection.streetId)
      ?.structures.find((st) => st.id === selection.structureId);
    const rackType = structure?.rackType ?? activePartType;
    addComponent(rackType);
  }, [hierarchy, selection, addComponent, activePartType, selectNode]);

  const addCabeca = useCallback(
    (end: CabecaEnd) => {
      const allWarehouseIds = warehouseStreetIds(hierarchy);
      if (allWarehouseIds.length === 0) {
        toast.info('Crie ao menos um corredor de armazém antes da cabeceira');
        return;
      }

      let streetIds = allWarehouseIds;
      if (selection?.level === 'street' && selection.streetId) {
        const street = hierarchy.streets.find((s) => s.id === selection.streetId);
        if (street?.type === 'corredor-armazem') {
          streetIds = [selection.streetId];
        }
      } else {
        streetIds = [allWarehouseIds[0]!];
      }

      const { hierarchy: next, cabecaId } = addCabecaToHierarchy(
        hierarchy,
        end,
        streetIds,
      );
      setHierarchy(next);
      setExpandedCabecaIds((prev) => new Set(prev).add(cabecaId));
      selectNode({ level: 'cabeca', cabecaId });
      toast.success(
        streetIds.length === 1
          ? 'Cabeceira criada no corredor selecionado'
          : 'Cabeceira transversal criada',
      );
    },
    [hierarchy, selection, selectNode],
  );

  const addContextHint = useMemo(() => {
    const partName = partLabelForType(activePartType);
    if (!selection) {
      return `Peça ativa: ${partName} — use + Corredor na hierarquia ou clique na peça para criar`;
    }
    if (selection.level === 'street') {
      return `Peça ativa: ${partName} — + Estrutura ou + Cabeceira`;
    }
    if (selection.level === 'cabeca') {
      return `Peça ativa: ${partName} — + Estrutura / + Posição · vínculos em Propriedades`;
    }
    if (selection.level === 'structure') {
      return `Peça ativa: ${partName} — + Posição ou clique na peça para nova estrutura`;
    }
    return `Peça ativa: ${partName} — edite na pré-visualização ou em Propriedades`;
  }, [selection, activePartType]);

  return {
    hierarchy,
    selection,
    selectedStreet,
    selectedCabeca,
    selectedStructure,
    selectedComponent,
    expandedStreetIds,
    expandedCabecaIds,
    expandedStructureIds,
    activePartType,
    addContextHint,
    handlePartChipClick,
    selectNode,
    selectPositionFromPreview,
    toggleStreetExpanded,
    toggleCabecaExpanded,
    toggleStructureExpanded,
    expandAllHierarchy,
    collapseAllHierarchy,
    collapseSelection,
    hierarchyPanelCollapsed,
    toggleHierarchyPanelCollapsed,
    addStreet,
    addStructureForPart,
    addStructureToSelection,
    addComponent,
    addComponentToSelection,
    addCabecaInicio: () => addCabeca('inicio'),
    addCabecaFim: () => addCabeca('fim'),
    removeSelected,
    zoomPercent,
    zoomIn,
    zoomOut,
    streetForm,
    cabecaForm,
    structureForm,
    componentForm,
    configForm,
    configDialogOpen,
    setConfigDialogOpen,
    propertiesDialogOpen,
    handlePropertiesDialogChange,
    openConfigDialog,
    openPropertiesDialog,
    resetProperties,
    confirmProperties,
    closeConfigDialog,
    previewArmazem,
    publishLayout,
    isPublishing,
    updateItemConfig,
    floorPressurePercent,
  };
}
