'use client';

import type { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import {
  ELEMENT_META,
  fieldLabelClassName,
  glassPanelClassName,
} from '@/features/armazem-layout/constants';
import { SlotEnderecoLinks } from '@/features/armazem-layout/components/slot-endereco-links';
import type { ArmazemLayoutSlotApi } from '@/features/armazem-layout/api';
import type { LayoutElement } from '@/features/armazem-layout/types';

type ElementPropertiesPanelProps = {
  element: LayoutElement | null;
  slots: ArmazemLayoutSlotApi[];
  unidadeId: string | undefined;
  isSaving: boolean;
  linkingSlotId: string | null;
  slotLinkError: string | null;
  onUpdate: (
    id: string,
    patch: Partial<Pick<LayoutElement, 'label' | 'gw' | 'gh' | 'levels' | 'zona'>>,
  ) => void;
  onRemove: (id: string) => void;
  onVincularSlot: (slotId: string, enderecoId: string | null) => Promise<void>;
  className?: string;
};

export function ElementPropertiesPanel({
  element,
  slots,
  unidadeId,
  isSaving,
  linkingSlotId,
  slotLinkError,
  onUpdate,
  onRemove,
  onVincularSlot,
  className,
}: ElementPropertiesPanelProps) {
  if (!element) {
    return (
      <aside
        className={cn(
          glassPanelClassName,
          'flex w-72 shrink-0 flex-col justify-center p-6 text-center',
          className,
        )}
      >
        <p className="text-sm font-medium text-foreground">Propriedades</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Selecione um elemento no mapa para editar label, tamanho e níveis.
        </p>
      </aside>
    );
  }

  const meta = ELEMENT_META[element.type];
  const Icon = meta.icon;

  return (
    <aside
      className={cn(
        glassPanelClassName,
        'flex w-72 shrink-0 flex-col gap-4 overflow-y-auto p-4',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg border',
            meta.bgClass,
            meta.borderClass,
          )}
        >
          <Icon className={cn('h-4 w-4', meta.iconClass)} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{meta.label}</p>
          <p className="font-mono text-[10px] text-muted-foreground">{element.id}</p>
        </div>
      </div>

      <Field label="Label">
        <input
          type="text"
          value={element.label}
          onChange={(event) =>
            onUpdate(element.id, { label: event.target.value || element.label })
          }
          className="w-full rounded-lg border border-outline-variant bg-surface-high px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Largura (células)">
          <input
            type="number"
            min={1}
            max={20}
            value={element.gw}
            onChange={(event) =>
              onUpdate(element.id, {
                gw: Math.max(1, parseInt(event.target.value, 10) || 1),
              })
            }
            className="w-full rounded-lg border border-outline-variant bg-surface-high px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Altura (células)">
          <input
            type="number"
            min={1}
            max={20}
            value={element.gh}
            onChange={(event) =>
              onUpdate(element.id, {
                gh: Math.max(1, parseInt(event.target.value, 10) || 1),
              })
            }
            className="w-full rounded-lg border border-outline-variant bg-surface-high px-3 py-2 text-sm"
          />
        </Field>
      </div>

      {element.type === 'estante' ? (
        <>
          <Field label="Níveis">
            <input
              type="number"
              min={1}
              max={5}
              value={element.levels ?? 3}
              onChange={(event) =>
                onUpdate(element.id, {
                  levels: Math.min(
                    5,
                    Math.max(1, parseInt(event.target.value, 10) || 1),
                  ),
                })
              }
              className="w-full rounded-lg border border-outline-variant bg-surface-high px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Zona">
            <input
              type="text"
              maxLength={2}
              value={element.zona ?? 'A'}
              onChange={(event) =>
                onUpdate(element.id, {
                  zona: event.target.value.toUpperCase().slice(0, 2) || 'A',
                })
              }
              className="w-full rounded-lg border border-outline-variant bg-surface-high px-3 py-2 text-sm uppercase"
            />
          </Field>
          <SlotEnderecoLinks
            element={element}
            slots={slots}
            unidadeId={unidadeId}
            isSaving={isSaving}
            linkingSlotId={linkingSlotId}
            onVincular={onVincularSlot}
          />
          {slotLinkError ? (
            <p className="text-xs text-destructive">{slotLinkError}</p>
          ) : null}
        </>
      ) : null}

      <div className="mt-auto border-t border-outline-variant pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(element.id)}
        >
          <Trash2 className="h-4 w-4" />
          Remover elemento
        </Button>
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={fieldLabelClassName}>{label}</span>
      {children}
    </label>
  );
}
