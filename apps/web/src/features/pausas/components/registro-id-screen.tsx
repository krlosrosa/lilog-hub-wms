'use client';

import { Barcode, Coffee, Play, Snowflake, UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button, cn } from '@lilog/ui';

import { glassPanelClassName } from '@/features/pausas/components/pausas-panel-classes';
import {
  PAUSA_TIPO_REGISTRO_DURACAO,
  PAUSA_TIPO_REGISTRO_LABELS,
  PAUSA_TIPOS_REGISTRO,
  type PausaTipoRegistro,
} from '@/features/pausas/types/pausas.schema';

export type RegistroIdScreenProps = {
  operatorId: string;
  onOperatorIdChange: (value: string) => void;
  showSelection: boolean;
  selectedType: PausaTipoRegistro | null;
  onSelectTipo: (tipo: PausaTipoRegistro) => void;
  onStartPause: () => void;
  isSubmitting?: boolean;
  operadorNaoEncontrado?: boolean;
};

const TIPO_ICONS: Record<PausaTipoRegistro, ReactNode> = {
  termica: <Snowflake className="size-12 text-tertiary" aria-hidden />,
  refeicao: (
    <UtensilsCrossed className="size-12 text-secondary" aria-hidden />
  ),
  outros: <Coffee className="size-12 text-muted-foreground" aria-hidden />,
};

export function RegistroIdScreen({
  operatorId,
  onOperatorIdChange,
  showSelection,
  selectedType,
  onSelectTipo,
  onStartPause,
  isSubmitting = false,
  operadorNaoEncontrado = false,
}: RegistroIdScreenProps) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10">
      <div className="w-full space-y-4 text-center">
        <h2 className="text-headline-md font-semibold text-foreground">
          Identificação do Operador
        </h2>
        <p className="text-body-md text-muted-foreground">
          Escaneie o crachá ou digite o ID para iniciar o registro de pausa.
        </p>
      </div>

      <div className="relative w-full max-w-md">
        <Barcode
          className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="000-000"
          value={operatorId}
          onChange={(e) => onOperatorIdChange(e.target.value)}
          className={cn(
            glassPanelClassName,
            'w-full py-6 pl-14 pr-4 text-center font-mono text-headline-lg tracking-widest text-foreground',
          )}
          aria-label="ID do operador"
        />
      </div>

      {operadorNaoEncontrado && (
        <p className="text-center text-body-md text-destructive">
          Operador não encontrado na sessão ativa ou sem presença registrada.
        </p>
      )}

      {showSelection && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="mb-6 text-center text-label-md text-muted-foreground">
            Selecione o tipo de pausa
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {PAUSA_TIPOS_REGISTRO.map((tipo) => (
              <TipoPausaButton
                key={tipo}
                tipo={tipo}
                icon={TIPO_ICONS[tipo]}
                selected={selectedType === tipo}
                onSelect={() => onSelectTipo(tipo)}
              />
            ))}
          </div>
          <div className="mt-8">
            <Button
              type="button"
              size="lg"
              className="w-full gap-3 py-6 text-headline-md"
              disabled={isSubmitting || !selectedType}
              onClick={onStartPause}
            >
              <Play className="size-6 fill-current" aria-hidden />
              Iniciar Pausa
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

type TipoPausaButtonProps = {
  tipo: PausaTipoRegistro;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
};

function TipoPausaButton({ tipo, icon, selected, onSelect }: TipoPausaButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        glassPanelClassName,
        'group relative flex flex-col items-center justify-center gap-3 rounded-2xl border p-8 transition-all active:scale-95',
        selected
          ? 'border-primary bg-primary/10 ring-2 ring-primary'
          : 'border-outline-variant hover:border-primary/50',
      )}
    >
      {icon}
      <span className="text-headline-md font-medium text-foreground">
        {PAUSA_TIPO_REGISTRO_LABELS[tipo]}
      </span>
      <span className="text-label-md text-muted-foreground">
        {PAUSA_TIPO_REGISTRO_DURACAO[tipo]}
      </span>
    </button>
  );
}
