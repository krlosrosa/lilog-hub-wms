'use client';

import type { ReactNode } from 'react';

import { cn } from '@lilog/ui';
import { Settings2 } from 'lucide-react';

import {
  AGRUPAMENTO_BATCH_LABELS,
  ESTRATEGIA_LABELS,
  ZONAS_LOGISTICAS,
  type ConfigEstrategia,
  type EstrategiaSeparacao,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

const panelClassName = cn(
  'overflow-hidden rounded-xl border border-outline-variant',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

const fieldInputClassName = cn(
  'rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

type EstrategiaConfigPanelProps = {
  estrategia: EstrategiaSeparacao;
  config: ConfigEstrategia;
  onChange: (config: ConfigEstrategia) => void;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function RadioPill<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opcao) => (
        <button
          key={opcao.value}
          type="button"
          onClick={() => onChange(opcao.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
            value === opcao.value
              ? 'border-primary/40 bg-primary/10 text-foreground'
              : 'border-outline-variant bg-surface-low text-muted-foreground',
          )}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  );
}

export function EstrategiaConfigPanel({
  estrategia,
  config,
  onChange,
}: EstrategiaConfigPanelProps) {
  const renderConfig = () => {
    switch (estrategia) {
      case 'discreto':
        if (config.tipo !== 'discreto') return null;
        return (
          <div className="max-w-xs">
            <FieldLabel>Limite de linhas por mapa</FieldLabel>
            <input
              type="number"
              min={5}
              max={100}
              value={config.limiteLinhasPorMapa}
              onChange={(e) =>
                onChange({
                  ...config,
                  limiteLinhasPorMapa: Math.max(5, Number(e.target.value) || 5),
                })
              }
              className={cn(fieldInputClassName, 'mt-2 w-full')}
            />
          </div>
        );

      case 'batch':
        if (config.tipo !== 'batch') return null;
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Agrupamento de itens</FieldLabel>
              <div className="mt-2">
                <RadioPill
                  value={config.agrupamento}
                  options={Object.entries(AGRUPAMENTO_BATCH_LABELS).map(
                    ([value, label]) => ({ value: value as typeof config.agrupamento, label }),
                  )}
                  onChange={(agrupamento) =>
                    onChange({ ...config, agrupamento })
                  }
                />
              </div>
            </div>
            <div>
              <FieldLabel>Máx. pedidos por mapa</FieldLabel>
              <input
                type="number"
                min={2}
                max={50}
                value={config.maxPedidosPorMapa}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maxPedidosPorMapa: Math.max(2, Number(e.target.value) || 2),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
          </div>
        );

      case 'cluster':
        if (config.tipo !== 'cluster') return null;
        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Pedidos por carrinho</FieldLabel>
              <input
                type="number"
                min={2}
                max={12}
                value={config.pedidosPorCarrinho}
                onChange={(e) =>
                  onChange({
                    ...config,
                    pedidosPorCarrinho: Math.min(
                      12,
                      Math.max(2, Number(e.target.value) || 2),
                    ),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low/40 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-foreground">
                  Usar compartimentos / divisórias
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Associa pedidos a Box 1, Box 2…
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.usarCompartimentos}
                onClick={() =>
                  onChange({
                    ...config,
                    usarCompartimentos: !config.usarCompartimentos,
                  })
                }
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  config.usarCompartimentos
                    ? 'bg-secondary-container'
                    : 'bg-surface-highest',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 size-5 rounded-full bg-foreground transition-transform',
                    config.usarCompartimentos ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </button>
            </div>
          </div>
        );

      case 'zone':
        if (config.tipo !== 'zone') return null;
        return (
          <div>
            <FieldLabel>Zonas logísticas ativas</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {ZONAS_LOGISTICAS.map((zona) => {
                const ativa = config.zonasAtivas.includes(zona);
                return (
                  <button
                    key={zona}
                    type="button"
                    onClick={() => {
                      const zonasAtivas = ativa
                        ? config.zonasAtivas.filter((z) => z !== zona)
                        : [...config.zonasAtivas, zona];
                      onChange({ ...config, zonasAtivas });
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      ativa
                        ? 'border-tertiary/40 bg-tertiary/10 text-tertiary'
                        : 'border-outline-variant bg-surface-low text-muted-foreground',
                    )}
                  >
                    {zona}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'wave':
        if (config.tipo !== 'wave') return null;
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel>Nome da onda (opcional)</FieldLabel>
              <input
                type="text"
                value={config.nomeOnda}
                onChange={(e) =>
                  onChange({ ...config, nomeOnda: e.target.value })
                }
                placeholder="Ex: ONDA-MANHÃ"
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel>Máx. pedidos</FieldLabel>
              <input
                type="number"
                min={1}
                value={config.maxPedidos}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maxPedidos: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel>Máx. linhas</FieldLabel>
              <input
                type="number"
                min={10}
                value={config.maxLinhas}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maxLinhas: Math.max(10, Number(e.target.value) || 10),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel>Máx. volumes</FieldLabel>
              <input
                type="number"
                min={1}
                value={config.maxVolumes}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maxVolumes: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
            <div>
              <FieldLabel>Máx. peso (kg)</FieldLabel>
              <input
                type="number"
                min={50}
                value={config.maxPeso}
                onChange={(e) =>
                  onChange({
                    ...config,
                    maxPeso: Math.max(50, Number(e.target.value) || 50),
                  })
                }
                className={cn(fieldInputClassName, 'mt-2 w-full')}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className={cn(panelClassName, 'space-y-4 p-5')}>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Settings2 className="size-4 text-primary" aria-hidden />
        Configurações de {ESTRATEGIA_LABELS[estrategia]}
      </h2>
      {renderConfig()}
    </section>
  );
}
