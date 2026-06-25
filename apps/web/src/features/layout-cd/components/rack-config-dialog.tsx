'use client';

import {
  Columns3,
  History,
  Package,
  RotateCcw,
  Rows3,
  Settings2,
} from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import {
  fieldLabelClassName,
  glassPanelClassName,
} from '@/features/layout-cd/components/layout-cd-panel-classes';
import type { RackConfigForm, RackType } from '@/features/layout-cd/types/layout-cd.schema';

const RACK_LEVELS = [5, 4, 3, 2, 1] as const;

const TYPE_CHIPS: { type: RackType; label: string; icon: typeof Package }[] = [
  { type: 'porta-palete', label: 'Porta-palete', icon: Package },
  { type: 'drive-in', label: 'Drive-in', icon: Columns3 },
  { type: 'flow-rack', label: 'Flow-rack', icon: Rows3 },
];

type RackConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<RackConfigForm>;
  onSave: (data: RackConfigForm) => void;
  onCancel: () => void;
};

export function RackConfigDialog({
  open,
  onOpenChange,
  form,
  onSave,
  onCancel,
}: RackConfigDialogProps) {
  const { register, watch, setValue, handleSubmit } = form;
  const activeLevel = watch('activeLevel');
  const positionsPerLevel = watch('positionsPerLevel');
  const capacityKg = watch('capacityKg');
  const storageLogic = watch('storageLogic');
  const rackType = watch('rackType');
  const heightPerLevelMm = watch('heightPerLevelMm');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden p-0">
        <div className={cn(glassPanelClassName, 'flex max-h-[85vh] overflow-hidden')}>
          <div className="relative flex flex-1 flex-col items-center justify-center bg-surface-lowest p-8">
            <DialogHeader className="absolute left-6 top-6 flex-row items-center gap-2 space-y-0 text-left">
              <Settings2 className="h-6 w-6 text-primary" />
              <DialogTitle className="text-xl uppercase tracking-tight text-primary">
                Configuração Técnica de Estrutura
              </DialogTitle>
            </DialogHeader>

            <div className="relative flex h-[420px] w-64 flex-col-reverse border-x-4 border-outline-variant">
              {RACK_LEVELS.map((level) => {
                const isActive = activeLevel === level;
                const heightM = ((level - 1) * 2.2).toFixed(1);
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setValue('activeLevel', level)}
                    className={cn(
                      'relative flex h-[20%] cursor-pointer items-center justify-center border-t-2 transition-all',
                      isActive
                        ? 'border-primary/50 bg-primary/10'
                        : 'border-outline-variant hover:bg-muted/30',
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-[10px]',
                        isActive
                          ? 'font-bold text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      LÍVEL {String(level).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'absolute -left-16 font-mono text-[10px]',
                        isActive ? 'font-bold text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {heightM}m
                    </span>
                    {isActive ? (
                      <div className="absolute inset-0 ring-2 ring-primary ring-offset-1 ring-offset-background" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {isActiveHud(activeLevel, heightPerLevelMm)}

            <div className="mt-8 flex gap-8">
              <LegendDot colorClass="bg-primary" label="Zona Ativa" />
              <LegendDot colorClass="bg-outline-variant" label="Estandarte" />
            </div>
          </div>

          <div className="flex w-[420px] flex-col border-l border-outline-variant bg-card p-8">
            <div className="mb-8">
              <span className="text-xs uppercase tracking-[0.2em] text-primary">
                Propriedades do Componente
              </span>
              <h3 className="mt-1 text-lg font-medium text-foreground">
                Rack Industrial Heavy-Duty
              </h3>
            </div>

            <form
              className="flex flex-1 flex-col space-y-6"
              onSubmit={handleSubmit(onSave)}
            >
              <div>
                <label className={fieldLabelClassName}>Altura por Nível (mm)</label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    className="w-full rounded border border-outline-variant bg-surface-low px-4 py-3 font-mono text-sm text-foreground outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    {...register('heightPerLevelMm')}
                  />
                  <span className="absolute right-4 top-3 font-mono text-xs text-muted-foreground">
                    mm
                  </span>
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>Posições por Nível</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([3, 4] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setValue('positionsPerLevel', n)}
                      className={cn(
                        'rounded border p-3 font-mono text-xs transition-all',
                        positionsPerLevel === n
                          ? 'border-primary-container bg-primary/5 text-primary ring-2 ring-primary-container'
                          : 'border-outline-variant bg-surface-low text-muted-foreground hover:border-outline',
                      )}
                    >
                      {String(n).padStart(2, '0')} Posições
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>
                  Capacidade por Posição (kg)
                </label>
                <input
                  type="range"
                  min={500}
                  max={3000}
                  step={100}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-low accent-primary"
                  {...register('capacityKg')}
                />
                <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                  <span>500kg</span>
                  <span className="font-bold text-primary">{capacityKg}kg</span>
                  <span>3000kg</span>
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>Lógica de Armazenagem</label>
                <div className="mt-2 flex gap-3">
                  <StorageLogicCard
                    logic="fifo"
                    selected={storageLogic === 'fifo'}
                    onSelect={() => setValue('storageLogic', 'fifo')}
                  />
                  <StorageLogicCard
                    logic="fefo"
                    selected={storageLogic === 'fefo'}
                    onSelect={() => setValue('storageLogic', 'fefo')}
                  />
                </div>
              </div>

              <div>
                <label className={fieldLabelClassName}>Tipo de Estrutura</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TYPE_CHIPS.map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('rackType', type)}
                      className={cn(
                        'flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[10px] transition-all',
                        rackType === type
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant text-muted-foreground opacity-50 hover:opacity-100',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex gap-4 border-t border-outline-variant pt-6">
                <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar Ajustes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isActiveHud(activeLevel: number, heightMm: number) {
  if (activeLevel !== 3) return null;
  return (
    <div className="absolute -right-36 bottom-[240px] flex items-center gap-2 rounded border border-primary/30 bg-surface-low px-3 py-1 font-mono text-xs text-primary ring-2 ring-primary">
      <span>H: {heightMm}mm</span>
    </div>
  );
}

function LegendDot({
  colorClass,
  label,
}: {
  colorClass: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-3 w-3 rounded-sm', colorClass)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function StorageLogicCard({
  logic,
  selected,
  onSelect,
}: {
  logic: 'fifo' | 'fefo';
  selected: boolean;
  onSelect: () => void;
}) {
  const isFifo = logic === 'fifo';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex flex-1 flex-col items-center rounded-lg border p-4 transition-all',
        selected
          ? 'border-primary-container bg-primary/5'
          : 'border-outline-variant hover:bg-surface-high',
      )}
    >
      {isFifo ? (
        <RotateCcw
          className={cn(
            'mb-1 h-8 w-8',
            selected ? 'text-primary' : 'text-muted-foreground',
          )}
        />
      ) : (
        <History
          className={cn(
            'mb-1 h-8 w-8',
            selected ? 'text-primary-container' : 'text-muted-foreground',
          )}
        />
      )}
      <span
        className={cn(
          'text-xs font-bold',
          selected && !isFifo && 'text-primary',
        )}
      >
        {logic.toUpperCase()}
      </span>
      <span className="text-[10px] uppercase text-muted-foreground">
        {isFifo ? 'First-In-First-Out' : 'First-Expired-First-Out'}
      </span>
    </button>
  );
}
