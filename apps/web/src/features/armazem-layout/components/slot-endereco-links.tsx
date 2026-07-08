'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';

import { cn } from '@lilog/ui';

import { listEnderecos } from '@/features/enderecos/lib/endereco-api';
import type { ArmazemLayoutSlotApi } from '@/features/armazem-layout/api';
import { fieldLabelClassName } from '@/features/armazem-layout/constants';
import type { LayoutElement } from '@/features/armazem-layout/types';

type EnderecoOption = {
  id: string;
  label: string;
};

type SlotEnderecoLinksProps = {
  element: LayoutElement;
  slots: ArmazemLayoutSlotApi[];
  unidadeId: string | undefined;
  isSaving: boolean;
  linkingSlotId: string | null;
  onVincular: (slotId: string, enderecoId: string | null) => Promise<void>;
};

export function SlotEnderecoLinks({
  element,
  slots,
  unidadeId,
  isSaving,
  linkingSlotId,
  onVincular,
}: SlotEnderecoLinksProps) {
  const [enderecos, setEnderecos] = useState<EnderecoOption[]>([]);
  const [isLoadingEnderecos, setIsLoadingEnderecos] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const elementSlots = useMemo(
    () =>
      slots
        .filter((slot) => slot.elementClientKey === element.id)
        .sort((a, b) => a.nivel - b.nivel),
    [element.id, slots],
  );

  const levels = element.levels ?? 3;

  useEffect(() => {
    if (!unidadeId) {
      setEnderecos([]);
      return;
    }

    let cancelled = false;

    async function loadEnderecos() {
      setIsLoadingEnderecos(true);
      setLoadError(null);

      try {
        const collected: EnderecoOption[] = [];
        let page = 1;
        let total = 0;

        do {
          const response = await listEnderecos({
            unidadeId,
            page,
            limit: 100,
          });

          if (cancelled) return;

          total = response.total;
          collected.push(
            ...response.items.map((item) => ({
              id: item.id,
              label: `${item.enderecoMascarado} · ${item.zona}-${item.rua}-${item.posicao}-${item.nivel}`,
            })),
          );
          page += 1;
        } while (collected.length < total);

        if (!cancelled) {
          setEnderecos(collected);
        }
      } catch (error) {
        if (!cancelled) {
          setEnderecos([]);
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar endereços',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingEnderecos(false);
        }
      }
    }

    void loadEnderecos();

    return () => {
      cancelled = true;
    };
  }, [unidadeId]);

  if (!unidadeId) {
    return (
      <p className="text-xs text-muted-foreground">
        Selecione uma unidade para vincular endereços.
      </p>
    );
  }

  if (isSaving) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Aguardando salvamento do layout...
      </p>
    );
  }

  if (elementSlots.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Salve o layout no servidor para gerar os slots desta estante.
      </p>
    );
  }

  return (
    <div className="space-y-3 border-t border-outline-variant pt-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Endereços por nível
        </p>
      </div>

      {loadError ? (
        <p className="text-xs text-destructive">{loadError}</p>
      ) : null}

      {isLoadingEnderecos ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando endereços...
        </p>
      ) : null}

      <div className="space-y-2">
        {Array.from({ length: levels }, (_, index) => {
          const nivel = index + 1;
          const slot = elementSlots.find((item) => item.nivel === nivel);

          if (!slot) {
            return (
              <label key={nivel} className="block space-y-1">
                <span className={fieldLabelClassName}>Nível {nivel}</span>
                <p className="text-xs text-muted-foreground">Slot pendente de salvamento</p>
              </label>
            );
          }

          const isLinking = linkingSlotId === slot.id;

          return (
            <label key={slot.id} className="block space-y-1">
              <span className={fieldLabelClassName}>Nível {nivel}</span>
              <select
                value={slot.enderecoId ?? ''}
                disabled={isLinking || isLoadingEnderecos}
                onChange={(event) => {
                  const value = event.target.value;
                  void onVincular(slot.id, value ? value : null);
                }}
                className={cn(
                  'w-full rounded-lg border border-outline-variant bg-surface-high px-3 py-2 text-sm',
                  isLinking && 'opacity-60',
                )}
              >
                <option value="">Sem vínculo</option>
                {enderecos.map((endereco) => (
                  <option key={endereco.id} value={endereco.id}>
                    {endereco.label}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}
