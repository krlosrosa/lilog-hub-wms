'use client';

import { Calculator } from 'lucide-react';

import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import { fieldInputClassName } from '@/components/ui/panel-styles';
import { calcularTempoConferenciaSeg } from '@/features/regras-conferencia/lib/calcular-tempo-esperado';
import type { RegraConferenciaForm } from '@/features/regras-conferencia/types/regra-conferencia.schema';

type TempoConferenciaPreviewProps = {
  params: RegraConferenciaForm;
  qtdLinhas: number;
  qtdPaletes: number;
  qtdClientes: number;
  onQtdLinhasChange: (value: number) => void;
  onQtdPaletesChange: (value: number) => void;
  onQtdClientesChange: (value: number) => void;
};

export function TempoConferenciaPreview({
  params,
  qtdLinhas,
  qtdPaletes,
  qtdClientes,
  onQtdLinhasChange,
  onQtdPaletesChange,
  onQtdClientesChange,
}: TempoConferenciaPreviewProps) {
  const tempoSeg = calcularTempoConferenciaSeg(
    params,
    qtdLinhas,
    qtdPaletes,
    qtdClientes,
  );
  const { minutos } = formatarTempoEsperado(tempoSeg);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-low/20 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="size-4 text-primary" aria-hidden />
        <h3 className="text-xs font-semibold text-foreground">Simulador de tempo esperado</h3>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="sim-linhas" className="text-[10px] font-medium text-muted-foreground">
            Linhas
          </label>
          <input
            id="sim-linhas"
            type="number"
            min={0}
            value={qtdLinhas}
            onChange={(e) => onQtdLinhasChange(Number(e.target.value) || 0)}
            className={fieldInputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sim-paletes" className="text-[10px] font-medium text-muted-foreground">
            Paletes
          </label>
          <input
            id="sim-paletes"
            type="number"
            min={0}
            value={qtdPaletes}
            onChange={(e) => onQtdPaletesChange(Number(e.target.value) || 0)}
            className={fieldInputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sim-clientes" className="text-[10px] font-medium text-muted-foreground">
            Clientes
          </label>
          <input
            id="sim-clientes"
            type="number"
            min={0}
            value={qtdClientes}
            onChange={(e) => onQtdClientesChange(Number(e.target.value) || 0)}
            className={fieldInputClassName}
          />
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Tempo esperado
        </p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {tempoSeg}s
          <span className="ml-2 text-base font-normal text-muted-foreground">
            ({minutos} min)
          </span>
        </p>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Fórmula: gordura início + 1º item + (linhas − 1) × demais itens + paletes × tempo/palete
        + (clientes − 1) × tempo/cliente + gordura fim
      </p>
    </div>
  );
}
