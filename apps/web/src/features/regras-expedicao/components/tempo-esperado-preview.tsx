'use client';

import { Calculator } from 'lucide-react';

import { fieldInputClassName } from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  calcularTempoEsperadoFromCounts,
  formatarTempoEsperado,
} from '@/features/regras-expedicao/lib/calcular-tempo-esperado';
import type { RegraExpedicaoForm } from '@/features/regras-expedicao/types/regra-expedicao.schema';

type TempoEsperadoPreviewProps = {
  params: RegraExpedicaoForm;
  qtdItens: number;
  qtdEnderecos: number;
  qtdItensSemEndereco: number;
  onQtdItensChange: (value: number) => void;
  onQtdEnderecosChange: (value: number) => void;
  onQtdItensSemEnderecoChange: (value: number) => void;
};

export function TempoEsperadoPreview({
  params,
  qtdItens,
  qtdEnderecos,
  qtdItensSemEndereco,
  onQtdItensChange,
  onQtdEnderecosChange,
  onQtdItensSemEnderecoChange,
}: TempoEsperadoPreviewProps) {
  const tempoSeg = calcularTempoEsperadoFromCounts(
    params,
    qtdItens,
    qtdEnderecos,
    qtdItensSemEndereco,
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
          <label htmlFor="sim-qtd-itens" className="text-[10px] font-medium text-muted-foreground">
            Quantidade de itens
          </label>
          <input
            id="sim-qtd-itens"
            type="number"
            min={0}
            value={qtdItens}
            onChange={(e) => onQtdItensChange(Number(e.target.value) || 0)}
            className={fieldInputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="sim-qtd-enderecos"
            className="text-[10px] font-medium text-muted-foreground"
          >
            Quantidade de endereços
          </label>
          <input
            id="sim-qtd-enderecos"
            type="number"
            min={0}
            value={qtdEnderecos}
            onChange={(e) => onQtdEnderecosChange(Number(e.target.value) || 0)}
            className={fieldInputClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="sim-qtd-itens-sem-endereco"
            className="text-[10px] font-medium text-muted-foreground"
          >
            Itens sem endereço
          </label>
          <input
            id="sim-qtd-itens-sem-endereco"
            type="number"
            min={0}
            value={qtdItensSemEndereco}
            onChange={(e) => onQtdItensSemEnderecoChange(Number(e.target.value) || 0)}
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
        Fórmula: gordura início + por item (1ª caixa + demais caixas) + deslocamento por
        ordem de endereço + itens sem endereço × deslocamento fixo + gordura fim
      </p>
    </div>
  );
}
