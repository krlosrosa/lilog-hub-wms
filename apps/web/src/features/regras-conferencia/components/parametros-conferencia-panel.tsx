'use client';

import { fieldInputClassName } from '@/features/expedicao-impressao-config/components/panel-styles';
import type { RegraConferenciaForm } from '@/features/regras-conferencia/types/regra-conferencia.schema';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

type ParametrosConferenciaPanelProps = {
  register: UseFormRegister<RegraConferenciaForm>;
  errors: FieldErrors<RegraConferenciaForm>;
  variant: 'conferencia' | 'gordura';
};

const CAMPOS_CONFERENCIA = [
  {
    name: 'tempoPrimeiroItemSeg' as const,
    label: 'Tempo do 1º item/linha',
    hint: 'Primeira bipagem ou contagem no mapa.',
  },
  {
    name: 'tempoDemaisItensSeg' as const,
    label: 'Tempo por item/linha adicional',
    hint: 'Demais linhas conferidas no mesmo mapa.',
  },
  {
    name: 'tempoPorPaleteSeg' as const,
    label: 'Tempo por palete conferido',
    hint: 'Validação adicional quando há palete completo.',
  },
  {
    name: 'tempoPorClienteSeg' as const,
    label: 'Tempo por cliente adicional',
    hint: 'Aplicado a partir do segundo cliente no mapa.',
  },
];

const CAMPOS_GORDURA = [
  {
    name: 'gorduraInicioMapaSeg' as const,
    label: 'Gordura no início do mapa',
    hint: 'Abrir mapa, ir ao staging e preparar mesa.',
  },
  {
    name: 'gorduraFimMapaSeg' as const,
    label: 'Gordura no fim do mapa',
    hint: 'Fechar mapa e liberar para carregamento.',
  },
];

export function ParametrosConferenciaPanel({
  register,
  errors,
  variant,
}: ParametrosConferenciaPanelProps) {
  const campos = variant === 'conferencia' ? CAMPOS_CONFERENCIA : CAMPOS_GORDURA;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map(({ name, label, hint }) => (
        <div key={name} className="space-y-1.5">
          <label htmlFor={name} className="text-xs font-medium text-foreground">
            {label}
          </label>
          <div className="relative">
            <input
              id={name}
              type="number"
              min={0}
              step={1}
              {...register(name, { valueAsNumber: true })}
              className={fieldInputClassName}
            />
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              seg
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
          {errors[name] && (
            <p className="text-[10px] text-destructive">{errors[name]?.message}</p>
          )}
        </div>
      ))}
    </div>
  );
}
