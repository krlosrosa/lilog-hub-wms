'use client';

import { Calculator } from 'lucide-react';

import { formatarTempoEsperado } from '@/features/config-operacional/lib/formatar-tempo-esperado';
import { fieldInputClassName } from '@/features/expedicao-impressao-config/components/panel-styles';
import { calcularTempoCarregamentoSeg } from '@/features/regras-carregamento/lib/calcular-tempo-esperado';
import type { RegraCarregamentoForm } from '@/features/regras-carregamento/types/regra-carregamento.schema';

type TempoCarregamentoPreviewProps = {
  params: RegraCarregamentoForm;
  qtdPaletes: number;
  qtdClientes: number;
  qtdTabelas: number;
  onQtdPaletesChange: (value: number) => void;
  onQtdClientesChange: (value: number) => void;
  onQtdTabelasChange: (value: number) => void;
};

export function TempoCarregamentoPreview({
  params,
  qtdPaletes,
  qtdClientes,
  qtdTabelas,
  onQtdPaletesChange,
  onQtdClientesChange,
  onQtdTabelasChange,
}: TempoCarregamentoPreviewProps) {
  const tempoSeg = calcularTempoCarregamentoSeg(
    params,
    qtdPaletes,
    qtdClientes,
    qtdTabelas,
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
          <label htmlFor="sim-clientes-carr" className="text-[10px] font-medium text-muted-foreground">
            Clientes
          </label>
          <input
            id="sim-clientes-carr"
            type="number"
            min={0}
            value={qtdClientes}
            onChange={(e) => onQtdClientesChange(Number(e.target.value) || 0)}
            className={fieldInputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sim-tabelas" className="text-[10px] font-medium text-muted-foreground">
            Tabelas
          </label>
          <input
            id="sim-tabelas"
            type="number"
            min={0}
            value={qtdTabelas}
            onChange={(e) => onQtdTabelasChange(Number(e.target.value) || 0)}
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
        Fórmula: gordura início + 1º palete + (paletes − 1) × demais paletes + (clientes − 1) ×
        tempo/cliente + tabelas × tempo/tabela + deslocamento doca + amarração + gordura fim
      </p>
    </div>
  );
}
