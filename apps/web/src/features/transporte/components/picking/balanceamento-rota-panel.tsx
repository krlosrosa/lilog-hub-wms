'use client';

import { cn } from '@lilog/ui';
import { GitBranch, Route } from 'lucide-react';

import type {
  ConfigBalanceamento,
  ConfigOtimizacaoRota,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

type BalanceamentoRotaPanelProps = {
  balanceamento: ConfigBalanceamento;
  otimizacaoRota: ConfigOtimizacaoRota;
  onBalanceamentoChange: (config: ConfigBalanceamento) => void;
  onOtimizacaoChange: (config: ConfigOtimizacaoRota) => void;
};

function ToggleRow({
  label,
  descricao,
  checked,
  onChange,
}: {
  label: string;
  descricao?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low/40 px-4 py-3">
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {descricao && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{descricao}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-secondary-container' : 'bg-surface-highest',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-foreground transition-transform',
            checked ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}

export function BalanceamentoRotaPanel({
  balanceamento,
  otimizacaoRota,
  onBalanceamentoChange,
  onOtimizacaoChange,
}: BalanceamentoRotaPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className={cn(panelClassName, 'space-y-3 p-5')}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GitBranch className="size-4 text-primary" aria-hidden />
          Balanceamento de Trabalho
        </h2>
        <ToggleRow
          label="Balanceamento ativo"
          descricao="Distribui carga entre mapas automaticamente"
          checked={balanceamento.ativo}
          onChange={(ativo) =>
            onBalanceamentoChange({ ...balanceamento, ativo })
          }
        />
        <ToggleRow
          label="Considerar quantidade de linhas"
          checked={balanceamento.considerarLinhas}
          onChange={(v) =>
            onBalanceamentoChange({ ...balanceamento, considerarLinhas: v })
          }
        />
        <ToggleRow
          label="Considerar volumes"
          checked={balanceamento.considerarVolumes}
          onChange={(v) =>
            onBalanceamentoChange({ ...balanceamento, considerarVolumes: v })
          }
        />
        <ToggleRow
          label="Considerar endereços distintos"
          checked={balanceamento.considerarEnderecos}
          onChange={(v) =>
            onBalanceamentoChange({ ...balanceamento, considerarEnderecos: v })
          }
        />
        <ToggleRow
          label="Considerar distância estimada"
          checked={balanceamento.considerarDistancia}
          onChange={(v) =>
            onBalanceamentoChange({ ...balanceamento, considerarDistancia: v })
          }
        />
        <ToggleRow
          label="Considerar peso total"
          checked={balanceamento.considerarPeso}
          onChange={(v) =>
            onBalanceamentoChange({ ...balanceamento, considerarPeso: v })
          }
        />
        <ToggleRow
          label="Rebalanceamento automático"
          descricao="Rebalanceia antes da geração definitiva"
          checked={balanceamento.rebalancearAutomatico}
          onChange={(v) =>
            onBalanceamentoChange({
              ...balanceamento,
              rebalancearAutomatico: v,
            })
          }
        />
      </section>

      <section className={cn(panelClassName, 'space-y-3 p-5')}>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Route className="size-4 text-primary" aria-hidden />
          Otimização de Rota de Coleta
        </h2>
        <ToggleRow
          label="Otimização ativa"
          descricao="Ordena itens pela sequência ideal de coleta"
          checked={otimizacaoRota.ativo}
          onChange={(ativo) =>
            onOtimizacaoChange({ ...otimizacaoRota, ativo })
          }
        />
        <ToggleRow
          label="Ordenar por rua"
          checked={otimizacaoRota.ordenarPorRua}
          onChange={(v) =>
            onOtimizacaoChange({ ...otimizacaoRota, ordenarPorRua: v })
          }
        />
        <ToggleRow
          label="Ordenar por corredor"
          checked={otimizacaoRota.ordenarPorCorredor}
          onChange={(v) =>
            onOtimizacaoChange({ ...otimizacaoRota, ordenarPorCorredor: v })
          }
        />
        <ToggleRow
          label="Ordenar por módulo"
          checked={otimizacaoRota.ordenarPorModulo}
          onChange={(v) =>
            onOtimizacaoChange({ ...otimizacaoRota, ordenarPorModulo: v })
          }
        />
        <ToggleRow
          label="Ordenar por nível"
          checked={otimizacaoRota.ordenarPorNivel}
          onChange={(v) =>
            onOtimizacaoChange({ ...otimizacaoRota, ordenarPorNivel: v })
          }
        />
        <ToggleRow
          label="Priorizar nível térreo (chão)"
          checked={otimizacaoRota.priorizarNivelChao}
          onChange={(v) =>
            onOtimizacaoChange({ ...otimizacaoRota, priorizarNivelChao: v })
          }
        />
      </section>
    </div>
  );
}
