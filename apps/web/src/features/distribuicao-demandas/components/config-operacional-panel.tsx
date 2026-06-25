'use client';

import { cn } from '@lilog/ui';

import {
  distribuicaoLabelClassName,
  distribuicaoPanelClassName,
  distribuicaoSectionTitleClassName,
} from '@/features/distribuicao-demandas/components/distribuicao-panel-classes';
import type {
  ConfigDistribuicao,
  Doca,
  EstrategiaBalanceamento,
} from '@/features/distribuicao-demandas/types/distribuicao-demandas.schema';

const ESTRATEGIA_LABEL: Record<EstrategiaBalanceamento, string> = {
  peso: 'Peso',
  caixas: 'Caixas',
  score_composto: 'Score composto',
  tempo_estimado: 'Tempo estimado',
};

export type ConfigOperacionalPanelProps = {
  config: ConfigDistribuicao;
  docas: Doca[];
  onChange: (patch: Partial<ConfigDistribuicao>) => void;
  className?: string;
};

export function ConfigOperacionalPanel({
  config,
  docas,
  onChange,
  className,
}: ConfigOperacionalPanelProps) {
  const toggleDoca = (docaId: string) => {
    const ids = config.docasSelecionadasIds.includes(docaId)
      ? config.docasSelecionadasIds.filter((id) => id !== docaId)
      : [...config.docasSelecionadasIds, docaId];
    onChange({ docasSelecionadasIds: ids });
  };

  return (
    <section
      className={cn(
        distribuicaoPanelClassName,
        'flex h-full min-h-[280px] flex-col overflow-hidden',
        className,
      )}
    >
      <header className="border-b border-outline-variant px-4 py-3">
        <h2 className={distribuicaoSectionTitleClassName}>
          A — Configuração operacional
        </h2>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className={distribuicaoLabelClassName}>Qtd. docas</span>
            <input
              type="number"
              min={1}
              max={8}
              value={config.qtdDocas}
              onChange={(e) => {
                const qtdDocas = Math.max(1, Number(e.target.value) || 1);
                const idsAtuais = config.docasSelecionadasIds.filter((id) =>
                  docas.some((d) => d.id === id),
                );
                const faltam = qtdDocas - idsAtuais.length;
                const extras =
                  faltam > 0
                    ? docas
                        .filter((d) => !idsAtuais.includes(d.id))
                        .slice(0, faltam)
                        .map((d) => d.id)
                    : [];
                onChange({
                  qtdDocas,
                  docasSelecionadasIds: [...idsAtuais, ...extras].slice(
                    0,
                    qtdDocas,
                  ),
                });
              }}
              className="w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5 font-mono text-xs tabular-nums"
            />
          </label>
          <label className="space-y-1">
            <span className={distribuicaoLabelClassName}>Qtd. funcionários</span>
            <input
              type="number"
              min={1}
              max={40}
              value={config.qtdFuncionarios}
              onChange={(e) =>
                onChange({
                  qtdFuncionarios: Number(e.target.value) || 1,
                })
              }
              className="w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5 font-mono text-xs tabular-nums"
            />
          </label>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.usarDocasDedicadas}
            onChange={(e) => onChange({ usarDocasDedicadas: e.target.checked })}
            className="size-3.5"
          />
          <span className="text-xs text-foreground">Usar docas dedicadas</span>
        </label>

        <div>
          <p className={cn(distribuicaoLabelClassName, 'mb-2')}>Docas disponíveis</p>
          <div className="grid grid-cols-2 gap-1">
            {docas.map((doca) => (
              <label
                key={doca.id}
                className="flex items-center gap-2 rounded border border-outline-variant/50 px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={config.docasSelecionadasIds.includes(doca.id)}
                  onChange={() => toggleDoca(doca.id)}
                  className="size-3"
                />
                <span className="font-mono">{doca.codigo}</span>
                {doca.transportadoraDedicada ? (
                  <span className="truncate text-[10px] text-muted-foreground">
                    {doca.transportadoraDedicada}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className={cn(distribuicaoLabelClassName, 'mb-2')}>
            Regras por transportadora
          </p>
          <div className="space-y-2">
            {config.regrasPorTransportadora.map((regra) => (
              <div
                key={regra.transportadora}
                className="space-y-2 rounded border border-outline-variant/50 p-2 text-xs"
              >
                <p className="font-medium">{regra.transportadora}</p>
                <label className="block space-y-1">
                  <span className={distribuicaoLabelClassName}>Doca dedicada</span>
                  <select
                    value={regra.docaDedicadaId ?? ''}
                    onChange={(e) => {
                      const regras = config.regrasPorTransportadora.map((r) =>
                        r.transportadora === regra.transportadora
                          ? {
                              ...r,
                              docaDedicadaId: e.target.value || null,
                            }
                          : r,
                      );
                      onChange({ regrasPorTransportadora: regras });
                    }}
                    className="w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1"
                  >
                    <option value="">Nenhuma</option>
                    {docas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.codigo}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>
        </div>

        <label className="block space-y-1">
          <span className={distribuicaoLabelClassName}>Estratégia de balanceamento</span>
          <select
            value={config.estrategia}
            onChange={(e) =>
              onChange({
                estrategia: e.target.value as EstrategiaBalanceamento,
              })
            }
            className="w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5 text-xs"
          >
            {(Object.keys(ESTRATEGIA_LABEL) as EstrategiaBalanceamento[]).map(
              (key) => (
                <option key={key} value={key}>
                  {ESTRATEGIA_LABEL[key]}
                </option>
              ),
            )}
          </select>
        </label>
      </div>
    </section>
  );
}
