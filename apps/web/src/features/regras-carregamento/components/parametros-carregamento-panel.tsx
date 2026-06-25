'use client';

import { fieldInputClassName } from '@/features/expedicao-impressao-config/components/panel-styles';
import type { RegraCarregamentoForm } from '@/features/regras-carregamento/types/regra-carregamento.schema';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

type ParametrosCarregamentoPanelProps = {
  register: UseFormRegister<RegraCarregamentoForm>;
  errors: FieldErrors<RegraCarregamentoForm>;
  variant: 'carga' | 'doca' | 'gordura';
};

const CAMPOS_CARGA = [
  {
    name: 'tempoPrimeiroPaleteSeg' as const,
    label: 'Tempo do 1º palete',
    hint: 'Primeira carga no veículo (empilhadeira + posicionamento).',
  },
  {
    name: 'tempoDemaisPaletesSeg' as const,
    label: 'Tempo por palete adicional',
    hint: 'Demais paletes na mesma minuta.',
  },
  {
    name: 'tempoPorClienteSeg' as const,
    label: 'Tempo por cliente adicional',
    hint: 'Segregação extra quando há múltiplos clientes.',
  },
  {
    name: 'tempoPorTabelaSeg' as const,
    label: 'Tempo por tabela da minuta',
    hint: 'Tabelas empresa/cliente na minuta de carregamento.',
  },
];

const CAMPOS_DOCA = [
  {
    name: 'deslocamentoInternoDocaSeg' as const,
    label: 'Deslocamento interno na doca',
    hint: 'Trajeto entre staging e baú do veículo.',
  },
  {
    name: 'tempoAmarracaoMinutaSeg' as const,
    label: 'Tempo de amarração/fechamento',
    hint: 'Lonas, travas, lacre e preparação para saída.',
  },
];

const CAMPOS_GORDURA = [
  {
    name: 'gorduraInicioMinutaSeg' as const,
    label: 'Gordura no início da minuta',
    hint: 'Posicionar veículo, conferir minuta e EPI.',
  },
  {
    name: 'gorduraFimMinutaSeg' as const,
    label: 'Gordura no fim da minuta',
    hint: 'Assinar minuta, liberar doca e registrar saída.',
  },
];

export function ParametrosCarregamentoPanel({
  register,
  errors,
  variant,
}: ParametrosCarregamentoPanelProps) {
  const campos =
    variant === 'carga'
      ? CAMPOS_CARGA
      : variant === 'doca'
        ? CAMPOS_DOCA
        : CAMPOS_GORDURA;

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
