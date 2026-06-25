'use client';

import { cn } from '@lilog/ui';
import { Boxes, Package } from 'lucide-react';

import {
  fieldInputClassName,
  sectionLabelClassName,
  segmentButtonClassName,
  segmentGroupClassName,
} from '@/features/expedicao-config-mapa/components/panel-styles';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';
import {
  PALLETIZATION_TYPE_LABELS,
  type PalletizationConfig,
  type PalletizationType,
} from '@/features/expedicao-config-mapa/types/config-mapa.schema';

type PalletizationPanelProps = {
  config: PalletizationConfig;
  onEnabledChange: (value: boolean) => void;
  onTypeChange: (type: PalletizationType) => void;
  onPercentualChange: (value: number) => void;
  onLinhasChange: (value: number) => void;
  onQuantidadeUnidadesChange: (value: number) => void;
};

export function PalletizationPanel({
  config,
  onEnabledChange,
  onTypeChange,
  onPercentualChange,
  onLinhasChange,
  onQuantidadeUnidadesChange,
}: PalletizationPanelProps) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-lg border px-2.5 py-2',
          config.enabled
            ? 'border-primary/30 bg-primary/5'
            : 'border-outline-variant bg-surface-low/40',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Package className="size-3.5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-xs font-semibold text-foreground">Paletização</p>
            <p className="text-[10px] text-muted-foreground">
              {config.enabled
                ? 'Quebra de carga ativa'
                : 'Ative para configurar a quebra'}
            </p>
          </div>
        </div>
        <SwitchToggle
          checked={config.enabled}
          onChange={() => onEnabledChange(!config.enabled)}
          label="Habilitar paletização"
        />
      </div>

      {config.enabled && (
        <>
          <div className="space-y-1.5">
            <span className={sectionLabelClassName}>Tipo de quebra</span>
            <div className={segmentGroupClassName}>
              {(Object.entries(PALLETIZATION_TYPE_LABELS) as [PalletizationType, string][]).map(
                ([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onTypeChange(type)}
                    className={segmentButtonClassName(config.type === type)}
                  >
                    {type === 'full' ? (
                      <span className="inline-flex items-center gap-1">
                        <Package className="size-3" aria-hidden />
                        {label}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Boxes className="size-3" aria-hidden />
                        {label}
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {config.type === 'full' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="pallet-percentual" className={sectionLabelClassName}>
                  Percentual
                </label>
                <div className="relative mt-1">
                  <input
                    id="pallet-percentual"
                    type="number"
                    min={0}
                    max={100}
                    value={config.percentual}
                    onChange={(event) =>
                      onPercentualChange(Number(event.target.value))
                    }
                    className={cn(fieldInputClassName, 'pr-7')}
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label htmlFor="pallet-linhas" className={sectionLabelClassName}>
                  Linhas
                </label>
                <input
                  id="pallet-linhas"
                  type="number"
                  min={1}
                  value={config.linhas}
                  onChange={(event) => onLinhasChange(Number(event.target.value))}
                  className={cn(fieldInputClassName, 'mt-1')}
                />
              </div>
            </div>
          )}

          {config.type === 'units' && (
            <div>
              <label htmlFor="pallet-unidades" className={sectionLabelClassName}>
                Quantidade
              </label>
              <input
                id="pallet-unidades"
                type="number"
                min={1}
                value={config.quantidadeUnidades}
                onChange={(event) =>
                  onQuantidadeUnidadesChange(Number(event.target.value))
                }
                className={cn(fieldInputClassName, 'mt-1')}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Número de unidades por bloco de separação.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
