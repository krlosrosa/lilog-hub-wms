'use client';

import { Info, RotateCcw, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import { fieldLabelClassName } from '@/features/layout-cd/components/layout-cd-panel-classes';
import type {
  CabecaForm,
  ComponentForm,
  LayoutHierarchy,
  LayoutSelection,
  RackType,
  StreetForm,
  StructureForm,
} from '@/features/layout-cd/types/layout-cd.schema';

const RACK_TYPE_OPTIONS: { value: RackType; label: string }[] = [
  { value: 'porta-palete', label: 'Porta-palete' },
  { value: 'drive-in', label: 'Drive-in' },
  { value: 'flow-rack', label: 'Flow-rack' },
  { value: 'pedestrian-path', label: 'Via pedestre' },
  { value: 'forklift-street', label: 'Via empilhadeira' },
  { value: 'safety-barrier', label: 'Barreira' },
];

type HierarchyPropertiesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: LayoutSelection | null;
  hierarchy: LayoutHierarchy;
  streetForm: UseFormReturn<StreetForm>;
  cabecaForm: UseFormReturn<CabecaForm>;
  structureForm: UseFormReturn<StructureForm>;
  componentForm: UseFormReturn<ComponentForm>;
  floorPressurePercent: number;
  onReset: () => void;
  onRemove: () => void;
  onApply: () => void;
  onOpenConfig?: () => void;
};

const STREET_TYPES = [
  { value: 'corredor-armazem', label: 'Corredor de armazém' },
  { value: 'zona-drive-in', label: 'Zona drive-in' },
  { value: 'corredor-trafego', label: 'Corredor de tráfego' },
] as const;

export function HierarchyPropertiesDialog({
  open,
  onOpenChange,
  selection,
  hierarchy,
  streetForm,
  cabecaForm,
  structureForm,
  componentForm,
  floorPressurePercent,
  onReset,
  onRemove,
  onApply,
  onOpenConfig,
}: HierarchyPropertiesDialogProps) {
  if (!selection) return null;

  const levelLabel =
    selection.level === 'street'
      ? 'Corredor'
      : selection.level === 'cabeca'
        ? 'Cabeceira transversal'
        : selection.level === 'structure'
          ? 'Estrutura'
          : 'Componente';

  const warehouseStreets = hierarchy.streets
    .filter((s) => s.type === 'corredor-armazem')
    .sort((a, b) => a.order - b.order);

  const cabecaStreetOptions =
    selection.cabecaId != null
      ? (hierarchy.cabecas.find((c) => c.id === selection.cabecaId)?.streetIds ?? [])
          .map((id) => hierarchy.streets.find((s) => s.id === id))
          .filter((s): s is NonNullable<typeof s> => !!s)
          .map((s) => ({ id: s.id, code: s.code }))
      : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Propriedades — {levelLabel}</DialogTitle>
            <span className="rounded bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-primary">
              {selection.level}
            </span>
          </div>
        </DialogHeader>

        {selection.level === 'street' ? (
          <StreetFields form={streetForm} />
        ) : null}
        {selection.level === 'cabeca' ? (
          <CabecaFields form={cabecaForm} streetOptions={warehouseStreets} />
        ) : null}
        {selection.level === 'structure' ? (
          <StructureFields
            form={structureForm}
            inCabeca={!!selection.cabecaId}
            streetOptions={cabecaStreetOptions}
          />
        ) : null}
        {selection.level === 'component' ? (
          <ComponentFields
            form={componentForm}
            onOpenConfig={onOpenConfig}
          />
        ) : null}

        <div className="flex flex-col gap-2 pt-4">
          <Button type="button" className="w-full" onClick={onApply}>
            Aplicar ao layout
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 gap-2" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>

        {selection.level === 'component' ? (
          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">Engineering Analysis</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-lowest">
              <div
                className="h-full bg-status-active/50"
                style={{ width: `${floorPressurePercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CabecaFields({
  form,
  streetOptions,
}: {
  form: UseFormReturn<CabecaForm>;
  streetOptions: { id: string; code: string; name: string }[];
}) {
  const { register, watch, setValue } = form;
  const selectedIds = watch('streetIds') ?? [];

  const toggleStreet = (streetId: string) => {
    const next = selectedIds.includes(streetId)
      ? selectedIds.filter((id) => id !== streetId)
      : [...selectedIds, streetId];
    setValue('streetIds', next.length > 0 ? next : [streetId], { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={fieldLabelClassName}>Código</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('code')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Nome</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('name')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Extremo</label>
        <select
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('end')}
        >
          <option value="inicio">Início (topo)</option>
          <option value="fim">Fim</option>
        </select>
      </div>
      <div>
        <label className={fieldLabelClassName}>Corredores vinculados</label>
        <p className="mt-1 text-xs text-muted-foreground">
          A largura no mapa vai do primeiro ao último corredor marcado (alinhado à
          grade). Desmarque para encurtar; marque mais para estender.
        </p>
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-outline-variant p-2">
          {streetOptions.map((street) => (
            <li key={street.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-high">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(street.id)}
                  onChange={() => toggleStreet(street.id)}
                />
                <span className="font-mono text-xs">{street.code}</span>
                <span className="truncate text-muted-foreground">{street.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StreetFields({ form }: { form: UseFormReturn<StreetForm> }) {
  const { register } = form;
  return (
    <div className="space-y-4">
      <div>
        <label className={fieldLabelClassName}>Código do corredor</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('code')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Nome</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('name')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Tipo de corredor</label>
        <select
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('type')}
        >
          {STREET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function StructureFields({
  form,
  inCabeca,
  streetOptions,
}: {
  form: UseFormReturn<StructureForm>;
  inCabeca?: boolean;
  streetOptions?: { id: string; code: string }[];
}) {
  const { register } = form;
  return (
    <div className="space-y-4">
      <div>
        <label className={fieldLabelClassName}>Código da estrutura</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('code')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Rótulo</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('label')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {inCabeca && streetOptions && streetOptions.length > 0 ? (
          <div className="col-span-2">
            <label className={fieldLabelClassName}>Coluna (corredor)</label>
            <select
              className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm"
              {...register('anchorStreetId')}
            >
              {streetOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className={fieldLabelClassName}>Lado (S1/S2)</label>
            <select
              className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm"
              {...register('side', { valueAsNumber: true })}
            >
              <option value={1}>Lado 1</option>
              <option value={2}>Lado 2</option>
            </select>
          </div>
        )}
        <div>
          <label className={fieldLabelClassName}>Tipo rack</label>
          <select
            className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2 text-sm"
            {...register('rackType')}
          >
            {RACK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ComponentFields({
  form,
  onOpenConfig,
}: {
  form: UseFormReturn<ComponentForm>;
  onOpenConfig?: () => void;
}) {
  const { register } = form;
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onOpenConfig}
        className="w-full rounded-xl border border-outline-variant bg-surface-low p-3 text-left text-xs hover:border-primary/30"
      >
        Abrir configuração de níveis (rack config)
      </button>
      <div>
        <label className={fieldLabelClassName}>Código da posição</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 font-mono text-sm"
          {...register('code')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Rótulo (opcional)</label>
        <input
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          placeholder="Ex.: SKU pesado, reserva…"
          {...register('label')}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Níveis de carga</label>
        <input
          type="number"
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('loadLevels', { valueAsNumber: true })}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Capacidade (Ton)</label>
        <input
          type="number"
          step="0.1"
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('capacityTon', { valueAsNumber: true })}
        />
      </div>
      <div>
        <label className={fieldLabelClassName}>Profundidade (mm)</label>
        <input
          type="number"
          className="mt-2 w-full rounded-lg border border-outline-variant bg-surface-lowest px-4 py-2 text-sm"
          {...register('depthMm', { valueAsNumber: true })}
        />
      </div>
    </div>
  );
}
