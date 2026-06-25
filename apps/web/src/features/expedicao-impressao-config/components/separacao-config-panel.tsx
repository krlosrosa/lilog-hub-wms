'use client';

import { cn } from '@lilog/ui';

import {
  fieldInputClassName,
  sectionLabelClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  FAIXA_FIFO_LABELS,
  FAIXAS_FIFO_OPCOES,
  type FaixaFifo,
  type OpcoesSeparacao,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';

const FAIXA_FIFO_CORES: Record<FaixaFifo, string> = {
  amarelo: 'border-yellow-400 bg-yellow-400/20 text-yellow-800',
  laranja: 'border-orange-400 bg-orange-400/20 text-orange-800',
  vermelho: 'border-red-400 bg-red-400/20 text-red-800',
};

type SeparacaoConfigPanelProps = {
  opcoes: OpcoesSeparacao;
  onMudarPaletesCompletos: (valor: boolean) => void;
  onMudarUnidadesIndividuais: (valor: boolean) => void;
  onMudarSegregarFifo: (valor: boolean) => void;
  onToggleFaixaFifo: (faixa: FaixaFifo) => void;
  onMudarPercentualMaximoDataFifo: (valor: number) => void;
};

function CompactToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <SwitchToggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export function SeparacaoConfigPanel({
  opcoes,
  onMudarPaletesCompletos,
  onMudarUnidadesIndividuais,
  onMudarSegregarFifo,
  onToggleFaixaFifo,
  onMudarPercentualMaximoDataFifo,
}: SeparacaoConfigPanelProps) {
  return (
    <div className="space-y-3">
      <CompactToggle
        label="Paletes completos"
        checked={opcoes.separarPaletesCompletos}
        onChange={() =>
          onMudarPaletesCompletos(!opcoes.separarPaletesCompletos)
        }
      />
      <CompactToggle
        label="Unidades individuais"
        checked={opcoes.separarUnidadesIndividuais}
        onChange={() =>
          onMudarUnidadesIndividuais(!opcoes.separarUnidadesIndividuais)
        }
      />
      <CompactToggle
        label="FIFO"
        checked={opcoes.segregarFifo}
        onChange={() => onMudarSegregarFifo(!opcoes.segregarFifo)}
      />

      {opcoes.segregarFifo ? (
        <div className="space-y-3 rounded-lg border border-outline-variant bg-surface-low/30 p-3">
          <div>
            <p className={sectionLabelClassName}>Faixas FIFO</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Selecione as faixas que devem ser segregadas na separação.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FAIXAS_FIFO_OPCOES.map((faixa) => {
                const selecionada = opcoes.faixasFifo.includes(faixa);

                return (
                  <button
                    key={faixa}
                    type="button"
                    onClick={() => onToggleFaixaFifo(faixa)}
                    aria-pressed={selecionada}
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold transition-opacity',
                      FAIXA_FIFO_CORES[faixa],
                      !selecionada && 'opacity-40',
                    )}
                  >
                    {FAIXA_FIFO_LABELS[faixa]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="percentual-maximo-data-fifo"
              className={sectionLabelClassName}
            >
              Range de data — % máximo
            </label>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Percentual máximo de data permitido no range FIFO para os itens
              segregados.
            </p>
            <div className="mt-2 flex max-w-xs items-center gap-2">
              <input
                id="percentual-maximo-data-fifo"
                type="number"
                min={0}
                max={100}
                step={1}
                value={opcoes.percentualMaximoDataFifo}
                onChange={(event) =>
                  onMudarPercentualMaximoDataFifo(Number(event.target.value))
                }
                className={cn(fieldInputClassName, 'font-mono')}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
