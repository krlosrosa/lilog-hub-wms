'use client';

import { fieldInputClassName } from '@/features/expedicao-impressao-config/components/panel-styles';
import type { RegraExpedicaoForm } from '@/features/regras-expedicao/types/regra-expedicao.schema';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

type ParametrosTempoPanelProps = {
  register: UseFormRegister<RegraExpedicaoForm>;
  errors: FieldErrors<RegraExpedicaoForm>;
  variant: 'separacao' | 'gordura';
};

const CAMPOS_SEPARACAO = [
  {
    name: 'deslocamentoEntreEnderecosSeg' as const,
    label: 'Deslocamento entre endereços',
    hint: 'Tempo médio para ir de um endereço ao próximo.',
  },
  {
    name: 'deslocamentoItensSemEnderecoSeg' as const,
    label: 'Deslocamento para itens sem endereço',
    hint: 'Tempo extra por item que não possui endereço de armazenagem definido.',
  },
  {
    name: 'tempoPrimeiraCaixaSeg' as const,
    label: 'Tempo para pegar a 1ª caixa',
    hint: 'Inclui localizar o item e a primeira pegada.',
  },
  {
    name: 'tempoDemaisCaixasSeg' as const,
    label: 'Tempo para cada caixa adicional',
    hint: 'Aplicado a partir da segunda unidade no mapa.',
  },
];

const CAMPOS_GORDURA = [
  {
    name: 'gorduraInicioMapaSeg' as const,
    label: 'Gordura no início do mapa',
    hint: 'Setup, login no coletor e deslocamento ao primeiro endereço.',
  },
  {
    name: 'gorduraFimMapaSeg' as const,
    label: 'Gordura no fim do mapa',
    hint: 'Conferência local e entrega no staging/expedição.',
  },
];

export function ParametrosTempoPanel({
  register,
  errors,
  variant,
}: ParametrosTempoPanelProps) {
  const campos = variant === 'separacao' ? CAMPOS_SEPARACAO : CAMPOS_GORDURA;

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
